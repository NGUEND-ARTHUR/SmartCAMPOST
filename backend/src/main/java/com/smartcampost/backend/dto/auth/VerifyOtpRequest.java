package com.smartcampost.backend.dto.auth;

import lombok.Data;

@Data
public class VerifyOtpRequest {
    private String phone;
    private String otpCode;
}
