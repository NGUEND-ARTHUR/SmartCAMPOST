package com.smartcampost.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    private String phone;      // numéro pour identifier le compte
    private String otp;        // code OTP reçu
    private String newPassword;
}
