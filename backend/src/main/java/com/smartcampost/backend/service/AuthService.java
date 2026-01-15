package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.auth.*;

public interface AuthService {

    // =================== REGISTER ===================
    AuthResponse registerClient(RegisterClientRequest request);

    // =================== LOGIN (password) ===================
    AuthResponse login(LoginRequest request);

    // =================== OTP GÉNÉRIQUE ===================
    /**
     * Sends an OTP and returns the code (for DEV only).
     */
    String sendOtp(String phone);
    boolean verifyOtp(String phone, String otp);

    // =================== CHANGE PASSWORD ===================
    void changePassword(ChangePasswordRequest request);

    // =================== RESET PASSWORD (OTP) ===================
    void requestPasswordReset(String phone);
    void resetPassword(ResetPasswordRequest request);

    // =================== LOGIN PAR OTP ===================
    void requestLoginOtp(String phone);
    AuthResponse loginWithOtp(LoginOtpConfirmRequest request);
}
