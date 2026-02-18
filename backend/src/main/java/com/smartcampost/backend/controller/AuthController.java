package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.auth.*;
import com.smartcampost.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    /**
     * Security default: NEVER expose OTP codes in API responses.
     * Enable locally only by setting SMARTCAMPOST_OTP_EXPOSE_CODE_IN_RESPONSE=true.
     */
    @Value("${smartcampost.otp.expose-code-in-response:false}")
    private boolean exposeOtpCodeInResponse;

    private final AuthService authService;

    // =================== REGISTER ===================
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterClientRequest request) {
        return ResponseEntity.ok(authService.registerClient(request));
    }

    // =================== LOGIN (password classique) ===================
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // =================== LOGIN PAR OTP ===================

    // Step 1 — demander OTP pour login
    @PostMapping("/login/otp/request")
    public ResponseEntity<Void> requestLoginOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.requestLoginOtp(request.getPhone());
        return ResponseEntity.ok().build();
    }

    // Step 2 — confirmer OTP + recevoir JWT
    @PostMapping("/login/otp/confirm")
    public ResponseEntity<AuthResponse> loginWithOtp(@Valid @RequestBody LoginOtpConfirmRequest request) {
        return ResponseEntity.ok(authService.loginWithOtp(request));
    }

    // =================== OTP GENERIC ===================

    @PostMapping("/send-otp")
    public ResponseEntity<SendOtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        SendOtpResponse response = authService.sendOtp(request.getPhone());
        if (!exposeOtpCodeInResponse) {
            // Return a JSON body (avoids axios empty-body edge cases) but with no OTP.
            return ResponseEntity.ok(SendOtpResponse.builder().build());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean verified = authService.verifyOtp(request.getPhone(), request.getOtp());
        return ResponseEntity.ok(new VerifyOtpResponse(verified));
    }

    // =================== PASSWORD RESET FLOW ===================

    // Step 1 — demander OTP pour reset
    @PostMapping("/password/reset/request")
    public ResponseEntity<Void> requestPasswordReset(@Valid @RequestBody SendOtpRequest request) {
        authService.requestPasswordReset(request.getPhone());
        return ResponseEntity.ok().build();
    }

    // Step 2 — confirmer OTP + changer mot de passe
    @PostMapping("/password/reset/confirm")
    public ResponseEntity<Void> confirmPasswordReset(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}
