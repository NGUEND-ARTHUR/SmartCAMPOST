package com.smartcampost.backend.dto.qr;

import lombok.Builder;
import lombok.Data;

/**
 * DTO for QR code verification request.
 * Contains the token extracted from the scanned QR code.
 */
@Data
@Builder
public class QrVerificationRequest {
    /**
     * The verification token from the QR code
     */
    private String token;

    /**
     * The HMAC signature for integrity verification
     */
    private String signature;

    /**
     * Optional: tracking reference for additional validation
     */
    private String trackingRef;

    /**
     * Client IP address (populated server-side)
     */
    private String clientIp;

    /**
     * User agent (populated server-side)
     */
    private String userAgent;
}
