package com.smartcampost.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private UUID userId;
    private String fullName;
    private String phone;
    private String accessToken;   // JWT or any token
    private String tokenType;     // e.g. "Bearer"
}
