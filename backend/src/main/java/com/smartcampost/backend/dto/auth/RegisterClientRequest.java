package com.smartcampost.backend.dto.auth;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterClientRequest {
    private String fullName;
    private String phone;
    private String email;
    private String preferredLanguage;
    private String password;
}
