package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.qr.QrVerificationRequest;
import com.smartcampost.backend.dto.qr.QrVerificationResponse;
import com.smartcampost.backend.dto.qr.SecureQrPayload;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PickupRequest;
import com.smartcampost.backend.model.QrVerificationToken;

import java.util.UUID;

/**
 * Service for QR code security operations including:
 * - Token generation and storage
 * - HMAC signature generation and verification
 * - Server-side QR code verification (anti-forgery)
 */
public interface QrSecurityService {

    // ==================== TOKEN GENERATION ====================

    /**
     * Generate a secure permanent QR token for a parcel.
     * Creates a new token in the database and returns the complete payload.
     */
    SecureQrPayload generatePermanentToken(Parcel parcel);

    /**
     * Generate a secure temporary QR token for a pickup request.
     * Creates a new token in the database with expiration.
     */
    SecureQrPayload generateTemporaryToken(PickupRequest pickup, int validityHours);

    /**
     * Regenerate a QR token for a parcel (invalidates previous tokens).
     */
    SecureQrPayload regenerateToken(UUID parcelId);

    // ==================== VERIFICATION ====================

    /**
     * Verify a scanned QR code.
     * This is the main server-side anti-forgery verification.
     * 
     * @param request The verification request containing the token and signature
     * @return Verification result with parcel/pickup details if valid
     */
    QrVerificationResponse verifyQrCode(QrVerificationRequest request);

    /**
     * Verify a QR code from its compact string representation.
     * Parses the QR content and performs full verification.
     * 
     * @param qrContent The raw content scanned from the QR code
     * @param clientIp The IP address of the verifying client
     * @param userAgent The user agent of the verifying client
     * @return Verification result
     */
    QrVerificationResponse verifyQrCodeContent(String qrContent, String clientIp, String userAgent);

    /**
     * Quick validation without full verification (for display purposes).
     * Does NOT record verification attempt.
     */
    boolean isValidToken(String token);

    // ==================== SIGNATURE OPERATIONS ====================

    /**
     * Generate HMAC-SHA256 signature for a payload.
     */
    String generateSignature(String data);

    /**
     * Verify a signature against data.
     */
    boolean verifySignature(String data, String signature);

    // ==================== TOKEN MANAGEMENT ====================

    /**
     * Revoke a specific token.
     */
    void revokeToken(String token, String reason);

    /**
     * Revoke all tokens for a parcel.
     */
    void revokeAllTokensForParcel(UUID parcelId, String reason);

    /**
     * Revoke all tokens for a pickup request.
     */
    void revokeAllTokensForPickup(UUID pickupId, String reason);

    /**
     * Get the current valid token for a parcel.
     */
    java.util.Optional<QrVerificationToken> getValidTokenForParcel(UUID parcelId);

    /**
     * Get the current valid token for a pickup.
     */
    java.util.Optional<QrVerificationToken> getValidTokenForPickup(UUID pickupId);

    /**
     * Clean up expired tokens.
     */
    int cleanupExpiredTokens();
}
