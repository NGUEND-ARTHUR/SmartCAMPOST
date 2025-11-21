package com.smartcampost.backend.dto.auth;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpRequest {

    private String phone;  // Phone number to validate OTP
    private String otp;    // The OTP code entered by user
}
