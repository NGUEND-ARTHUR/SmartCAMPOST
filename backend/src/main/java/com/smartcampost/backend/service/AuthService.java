package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.auth.*;

public interface AuthService {

    AuthResponse registerClient(RegisterClientRequest request);

    AuthResponse login(LoginRequest request);

    void sendOtp(String phone);

    boolean verifyOtp(String phone, String otp);

    void changePassword(ChangePasswordRequest request);
}
