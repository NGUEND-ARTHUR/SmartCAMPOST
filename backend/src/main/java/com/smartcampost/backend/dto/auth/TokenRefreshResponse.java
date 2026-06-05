package com.smartcampost.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response body for POST /api/auth/refresh
 * Contains a fresh access token and the same (or renewed) refresh token.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenRefreshResponse {

    private String accessToken;

    @Builder.Default
    private String tokenType = "Bearer";

    /** Expiry in seconds from now (matches JWT_EXPIRATION_HOURS * 3600) */
    private long expiresIn;

    private String refreshToken;
}
