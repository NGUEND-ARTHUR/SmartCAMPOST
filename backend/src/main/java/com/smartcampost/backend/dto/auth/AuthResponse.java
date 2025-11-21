package com.smartcampost.backend.dto.auth;

import lombok.*;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private UUID userId;
    private UUID entityId;
    private String fullName;
    private String phone;
    private String role;
    private String accessToken;
    private String tokenType;
}
