package com.smartcampost.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for POST /api/auth/refresh
 * Client sends the refresh token to get a new access token.
 */
@Data
public class TokenRefreshRequest {

    @NotBlank(message = "refreshToken is required")
    private String refreshToken;
}
