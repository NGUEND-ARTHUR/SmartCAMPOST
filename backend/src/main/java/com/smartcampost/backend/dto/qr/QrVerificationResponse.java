package com.smartcampost.backend.dto.qr;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for QR code verification response.
 * Contains the verification result and parcel/pickup details if valid.
 */
@Data
@Builder
public class QrVerificationResponse {
    
    // ==================== VERIFICATION STATUS ====================
    
    /**
     * Whether the QR code is valid
     */
    private boolean valid;

    /**
     * Verification result code
     */
    private VerificationStatus status;

    /**
     * Human-readable message explaining the verification result
     */
    private String message;

    /**
     * Error code if verification failed
     */
    private String errorCode;

    // ==================== TOKEN INFO ====================

    /**
     * The token ID (for audit purposes)
     */
    private UUID tokenId;

    /**
     * Type of QR code (PERMANENT or TEMPORARY)
     */
    private String tokenType;

    /**
     * When the token was created
     */
    private Instant tokenCreatedAt;

    /**
     * When the token expires (null for permanent)
     */
    private Instant tokenExpiresAt;

    /**
     * Number of times this QR has been verified
     */
    private Integer verificationCount;

    // ==================== PARCEL INFO (if applicable) ====================

    /**
     * Associated parcel ID
     */
    private UUID parcelId;

    /**
     * Parcel tracking reference
     */
    private String trackingRef;

    /**
     * Current parcel status
     */
    private String parcelStatus;

    /**
     * Service type (STANDARD, EXPRESS)
     */
    private String serviceType;

    /**
     * Parcel weight
     */
    private Double weight;

    /**
     * Parcel dimensions
     */
    private String dimensions;

    /**
     * Whether fragile
     */
    private Boolean fragile;

    /**
     * Client name
     */
    private String clientName;

    /**
     * Origin agency name
     */
    private String originAgency;

    /**
     * Destination agency name
     */
    private String destinationAgency;

    // ==================== PICKUP INFO (for temporary QR) ====================

    /**
     * Associated pickup request ID
     */
    private UUID pickupId;

    /**
     * Pickup request status
     */
    private String pickupStatus;

    /**
     * Requested pickup date
     */
    private String requestedDate;

    /**
     * Time window for pickup
     */
    private String timeWindow;

    // ==================== SECURITY INFO ====================

    /**
     * Timestamp of this verification
     */
    private Instant verifiedAt;

    /**
     * Whether this QR code shows signs of tampering
     */
    private boolean tamperingDetected;

    /**
     * Risk level (LOW, MEDIUM, HIGH)
     */
    private String riskLevel;

    /**
     * Verification status enum
     */
    public enum VerificationStatus {
        /**
         * QR code is valid and authenticated
         */
        VALID,

        /**
         * QR code token not found in database (possible forgery)
         */
        TOKEN_NOT_FOUND,

        /**
         * QR code has been revoked
         */
        TOKEN_REVOKED,

        /**
         * QR code has expired
         */
        TOKEN_EXPIRED,

        /**
         * Signature mismatch (data tampered)
         */
        SIGNATURE_INVALID,

        /**
         * Associated parcel not found
         */
        PARCEL_NOT_FOUND,

        /**
         * Associated pickup not found
         */
        PICKUP_NOT_FOUND,

        /**
         * Rate limit exceeded (too many verification attempts)
         */
        RATE_LIMIT_EXCEEDED,

        /**
         * Generic error during verification
         */
        VERIFICATION_ERROR
    }

    /**
     * Create a successful verification response
     */
    public static QrVerificationResponse success(String message) {
        return QrVerificationResponse.builder()
                .valid(true)
                .status(VerificationStatus.VALID)
                .message(message)
                .verifiedAt(Instant.now())
                .riskLevel("LOW")
                .build();
    }

    /**
     * Create a failed verification response
     */
    public static QrVerificationResponse failure(VerificationStatus status, String message, String errorCode) {
        return QrVerificationResponse.builder()
                .valid(false)
                .status(status)
                .message(message)
                .errorCode(errorCode)
                .verifiedAt(Instant.now())
                .tamperingDetected(status == VerificationStatus.SIGNATURE_INVALID || 
                                   status == VerificationStatus.TOKEN_NOT_FOUND)
                .riskLevel(status == VerificationStatus.SIGNATURE_INVALID ? "HIGH" : "MEDIUM")
                .build();
    }
}
