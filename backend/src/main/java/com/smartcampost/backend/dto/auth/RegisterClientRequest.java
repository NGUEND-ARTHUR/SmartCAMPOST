package com.smartcampost.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterClientRequest {

    private String fullName;
    private String phone;
    private String email;
    private String preferredLanguage;
    private String password;

    // 👉 OTP saisi par le user pour finaliser l'inscription
    private String otp;
}
