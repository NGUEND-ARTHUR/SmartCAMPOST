package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.auth.*;
import com.smartcampost.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // =================== REGISTER ===================
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterClientRequest request) {
        return ResponseEntity.ok(authService.registerClient(request));
    }

    // =================== LOGIN (password classique) ===================
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // =================== LOGIN PAR OTP ===================

    // Step 1 — demander OTP pour login
    @PostMapping("/login/otp/request")
    public ResponseEntity<Void> requestLoginOtp(@RequestBody SendOtpRequest request) {
        authService.requestLoginOtp(request.getPhone());
        return ResponseEntity.ok().build();
    }

    // Step 2 — confirmer OTP + recevoir JWT
    @PostMapping("/login/otp/confirm")
    public ResponseEntity<AuthResponse> loginWithOtp(@RequestBody LoginOtpConfirmRequest request) {
        return ResponseEntity.ok(authService.loginWithOtp(request));
    }

    // =================== OTP GENERIC ===================

    @PostMapping("/send-otp")
    public ResponseEntity<Void> sendOtp(@RequestBody SendOtpRequest request) {
        authService.sendOtp(request.getPhone());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        boolean verified = authService.verifyOtp(request.getPhone(), request.getOtp());
        return ResponseEntity.ok(new VerifyOtpResponse(verified));
    }

    // =================== PASSWORD RESET FLOW ===================

    // Step 1 — demander OTP pour reset
    @PostMapping("/password/reset/request")
    public ResponseEntity<Void> requestPasswordReset(@RequestBody SendOtpRequest request) {
        authService.requestPasswordReset(request.getPhone());
        return ResponseEntity.ok().build();
    }

    // Step 2 — confirmer OTP + changer mot de passe
    @PostMapping("/password/reset/confirm")
    public ResponseEntity<Void> confirmPasswordReset(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}
