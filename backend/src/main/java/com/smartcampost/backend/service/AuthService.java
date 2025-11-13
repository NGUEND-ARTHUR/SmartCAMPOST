package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.auth.AuthResponse;
import com.smartcampost.backend.dto.auth.ChangePasswordRequest;
import com.smartcampost.backend.dto.auth.LoginRequest;
import com.smartcampost.backend.dto.auth.RegisterClientRequest;

public interface AuthService {

    /**
     * Register a new client (creates Client + security user).
     */
    AuthResponse registerClient(RegisterClientRequest request);

    /**
     * Send OTP to a phone number (for login / verification).
     */
    void sendPhoneOtp(String phone);

    /**
     * Verify OTP received by the client.
     */
    boolean verifyPhoneOtp(String phone, String otpCode);

    /**
     * Login with phone + password and return a JWT / session token.
     */
    AuthResponse login(LoginRequest request);

    /**
     * Change password for the currently authenticated user.
     */
    void changePassword(ChangePasswordRequest request);
}
