package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.auth.*;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.security.JwtService;
import com.smartcampost.backend.security.TokenBlacklistService;
import com.smartcampost.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import java.util.Map;
import java.util.UUID;

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
    private final TokenBlacklistService tokenBlacklistService;
    private final JwtService jwtService;
    private final UserAccountRepository userAccountRepository;

    // =================== LOGOUT ===================
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            tokenBlacklistService.blacklist(header.substring(7));
        }
        return ResponseEntity.ok().build();
    }

    // =================== TOKEN REFRESH ===================
    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        // Validate the refresh token signature and type
        if (!jwtService.validateRefreshToken(refreshToken)) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid or expired refresh token");
        }

        // Reject blacklisted tokens (e.g. from a previous logout)
        if (tokenBlacklistService.isBlacklisted(refreshToken)) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Refresh token has been revoked");
        }

        // Load user from the subject claim
        String userId = jwtService.extractSubject(refreshToken);
        UserAccount user = userAccountRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "User not found"));

        // Issue fresh tokens (rotate refresh token for security)
        String newAccessToken  = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        // Blacklist the old refresh token to prevent reuse (one-time use)
        tokenBlacklistService.blacklist(refreshToken);

        return ResponseEntity.ok(TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtService.getTokenValidityMs() / 1000)
                .build());
    }

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

    // =================== LOGIN WITH GOOGLE ===================
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
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
        if (!verified) {
            // SECURITY: Return 400 on OTP failure to allow proper client-side error handling
            // and prevent silent brute-force attempts
            return ResponseEntity.badRequest().body(new VerifyOtpResponse(false));
        }
        return ResponseEntity.ok(new VerifyOtpResponse(true));
    }

    @PatchMapping("/me/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updateMyAccountProfile(@RequestBody Map<String, Object> request) {
        UserAccount user = getCurrentUser();
        String email = stringValue(request.get("email"));
        String phone = stringValue(request.get("phone"));
        String photoUrl = stringValue(request.get("photoUrl"));
        if (email != null && !email.isBlank()) {
            user.setEmail(email.trim());
        }
        if (phone != null && !phone.isBlank()) {
            user.setPhone(phone.trim());
        }
        if (photoUrl != null && !photoUrl.isBlank()) {
            user.setPhotoUrl(photoUrl.trim());
        }
        UserAccount saved = userAccountRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "phone", saved.getPhone() == null ? "" : saved.getPhone(),
                "email", saved.getEmail() == null ? "" : saved.getEmail(),
                "photoUrl", saved.getPhotoUrl() == null ? "" : saved.getPhotoUrl(),
                "role", saved.getRole() == null ? "" : saved.getRole().name(),
                "entityId", saved.getEntityId(),
                "frozen", saved.getFrozen() != null && saved.getFrozen()
        ));
    }

    // =================== PASSWORD RESET FLOW ===================

    // Step 1 — demander OTP pour reset
    @PostMapping("/password/reset/request")
    public ResponseEntity<SendOtpResponse> requestPasswordReset(@Valid @RequestBody SendOtpRequest request) {
        String code = authService.requestPasswordReset(request.getPhone());
        if (!exposeOtpCodeInResponse) {
            // SECURITY: never echo the reset code back to the caller — anyone who knows a
            // victim's phone number could otherwise call this endpoint to get the OTP and
            // immediately take over the account via /password/reset/confirm.
            return ResponseEntity.ok(SendOtpResponse.builder().build());
        }
        return ResponseEntity.ok(SendOtpResponse.builder().otp(code).build());
    }

    // Step 2 — confirmer OTP + changer mot de passe
    @PostMapping("/password/reset/confirm")
    public ResponseEntity<Void> confirmPasswordReset(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    private UserAccount getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Not authenticated");
        }
        String principal = auth.getName();
        return userAccountRepository.findByPhone(principal)
                .or(() -> {
                    try {
                        return userAccountRepository.findById(UUID.fromString(principal));
                    } catch (IllegalArgumentException ex) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseThrow(() -> new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "User not found"));
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
