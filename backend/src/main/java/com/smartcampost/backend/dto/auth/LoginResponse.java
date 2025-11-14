package com.smartcampost.backend.dto.auth;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class LoginResponse {
    private UUID clientId;
    private String fullName;
    private String phone;
    private String token;        // JWT or session token
    private String tokenType;    // "Bearer"
}
