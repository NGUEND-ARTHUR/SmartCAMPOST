package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.qr.QrVerificationRequest;
import com.smartcampost.backend.dto.qr.QrVerificationResponse;
import com.smartcampost.backend.dto.qr.QrVerificationResponse.VerificationStatus;
import com.smartcampost.backend.dto.qr.SecureQrPayload;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PickupRequest;
import com.smartcampost.backend.model.QrVerificationToken;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.QrTokenType;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.QrVerificationTokenRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.QrSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of QR code security service.
 * Provides cryptographic security for QR code generation and verification.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QrSecurityServiceImpl implements QrSecurityService {

    private final QrVerificationTokenRepository tokenRepository;
    private final ParcelRepository parcelRepository;
    private final UserAccountRepository userAccountRepository;

    /**
     * Secret key for HMAC signature (should be configured in application.yaml)
     */
    @Value("${smartcampost.qr.secret-key:SmartCampostSecureQRKey2024!@#$%}")
    private String secretKey;

    /**
     * Maximum verification attempts per hour (rate limiting)
     */
    @Value("${smartcampost.qr.max-verifications-per-hour:100}")
    private int maxVerificationsPerHour;

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int TOKEN_LENGTH = 32;
    private static final int SIGNATURE_LENGTH = 16;
    private static final int QR_PAYLOAD_VERSION = 1;

    // ==================== TOKEN GENERATION ====================

    @Override
    @Transactional
    public SecureQrPayload generatePermanentToken(Parcel parcel) {
        log.info("Generating permanent QR token for parcel: {}", parcel.getTrackingRef());

        // Invalidate any existing valid tokens for this parcel
        tokenRepository.invalidateAllTokensForParcel(parcel.getId(), "New token generated");

        // Generate secure token
        String token = generateSecureRandomToken();
        long timestamp = Instant.now().getEpochSecond();

        // Build payload for signing
        SecureQrPayload payload = SecureQrPayload.builder()
                .version(QR_PAYLOAD_VERSION)
                .type("P")
                .token(token)
                .ref(parcel.getTrackingRef())
                .ts(timestamp)
                .build();

        // Generate signature
        String signature = generateSignature(payload.getSignableData());
        String truncatedSignature = truncateSignature(signature);
        payload.setSig(truncatedSignature);

        // Store token in database
        QrVerificationToken tokenEntity = QrVerificationToken.builder()
                .id(UUID.randomUUID())
                .token(token)
                .signature(signature) // Store full signature in DB
                .tokenType(QrTokenType.PERMANENT)
                .parcel(parcel)
                .createdAt(Instant.now())
                .expiresAt(null) // Permanent tokens don't expire
                .valid(true)
                .verificationCount(0)
                .build();

        tokenRepository.save(tokenEntity);

        log.info("Created permanent QR token for parcel {} with token ID {}", 
                parcel.getTrackingRef(), tokenEntity.getId());

        return payload;
    }

    @Override
    @Transactional
    public SecureQrPayload generateTemporaryToken(PickupRequest pickup, int validityHours) {
        Parcel parcel = pickup.getParcel();
        log.info("Generating temporary QR token for pickup {} (parcel: {})", 
                pickup.getId(), parcel.getTrackingRef());

        // Invalidate any existing valid tokens for this pickup
        tokenRepository.invalidateAllTokensForPickup(pickup.getId(), "New temporary token generated");

        // Generate secure token
        String token = generateSecureRandomToken();
        long timestamp = Instant.now().getEpochSecond();

        // Build payload for signing
        SecureQrPayload payload = SecureQrPayload.builder()
                .version(QR_PAYLOAD_VERSION)
                .type("T")
                .token(token)
                .ref("TMP-" + parcel.getTrackingRef())
                .ts(timestamp)
                .build();

        // Generate signature
        String signature = generateSignature(payload.getSignableData());
        String truncatedSignature = truncateSignature(signature);
        payload.setSig(truncatedSignature);

        // Store token in database
        Instant expiresAt = Instant.now().plus(validityHours, ChronoUnit.HOURS);
        QrVerificationToken tokenEntity = QrVerificationToken.builder()
                .id(UUID.randomUUID())
                .token(token)
                .signature(signature)
                .tokenType(QrTokenType.TEMPORARY)
                .parcel(parcel)
                .pickup(pickup)
                .createdAt(Instant.now())
                .expiresAt(expiresAt)
                .valid(true)
                .verificationCount(0)
                .build();

        tokenRepository.save(tokenEntity);

        log.info("Created temporary QR token for pickup {} with token ID {}, expires at {}", 
                pickup.getId(), tokenEntity.getId(), expiresAt);

        return payload;
    }

    @Override
    @Transactional
    public SecureQrPayload regenerateToken(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        return generatePermanentToken(parcel);
    }

    // ==================== VERIFICATION ====================

    @Override
    @Transactional
    public QrVerificationResponse verifyQrCode(QrVerificationRequest request) {
        log.info("Verifying QR code token");

        try {
            // Find token in database
            Optional<QrVerificationToken> tokenOpt = tokenRepository.findByToken(request.getToken());

            if (tokenOpt.isEmpty()) {
                log.warn("QR token not found: potential forgery attempt from IP {}", request.getClientIp());
                return QrVerificationResponse.failure(
                        VerificationStatus.TOKEN_NOT_FOUND,
                        "QR code non reconnu. Ce code pourrait être falsifié.",
                        "QR_TOKEN_NOT_FOUND"
                );
            }

            QrVerificationToken tokenEntity = tokenOpt.get();

            // Check if token is revoked
            if (!tokenEntity.isValid()) {
                log.warn("Revoked token used: {} (reason: {})", 
                        tokenEntity.getId(), tokenEntity.getRevocationReason());
                return QrVerificationResponse.failure(
                        VerificationStatus.TOKEN_REVOKED,
                        "Ce QR code a été révoqué: " + tokenEntity.getRevocationReason(),
                        "QR_TOKEN_REVOKED"
                );
            }

            // Check expiration for temporary tokens
            if (tokenEntity.isExpired()) {
                log.info("Expired token used: {}", tokenEntity.getId());
                return QrVerificationResponse.failure(
                        VerificationStatus.TOKEN_EXPIRED,
                        "Ce QR code temporaire a expiré.",
                        "QR_TOKEN_EXPIRED"
                );
            }

            // Verify signature if provided
            if (request.getSignature() != null) {
                String expectedData = buildSignableData(tokenEntity);
                if (!verifySignature(expectedData, request.getSignature())) {
                    log.error("Signature mismatch for token {}: tampering detected!", tokenEntity.getId());
                    return QrVerificationResponse.failure(
                            VerificationStatus.SIGNATURE_INVALID,
                            "Signature invalide. Ce QR code a peut-être été falsifié.",
                            "QR_SIGNATURE_INVALID"
                    );
                }
            }

            // Record verification attempt
            UserAccount verifier = getCurrentUserAccount();
            tokenEntity.recordVerification(verifier, request.getClientIp(), request.getUserAgent());
            tokenRepository.save(tokenEntity);

            // Build success response with parcel/pickup details
            return buildSuccessResponse(tokenEntity);

        } catch (Exception e) {
            log.error("Error during QR verification", e);
            return QrVerificationResponse.failure(
                    VerificationStatus.VERIFICATION_ERROR,
                    "Erreur lors de la vérification du QR code.",
                    "QR_VERIFICATION_ERROR"
            );
        }
    }

    @Override
    @Transactional
    public QrVerificationResponse verifyQrCodeContent(String qrContent, String clientIp, String userAgent) {
        log.info("Verifying QR code content from IP: {}", clientIp);

        try {
            // Parse the compact QR payload
            SecureQrPayload payload = SecureQrPayload.fromCompactString(qrContent);

            // Verify the signature first (before any DB lookup)
            String signableData = payload.getSignableData();
            String fullSignature = generateSignature(signableData);
            String truncatedExpected = truncateSignature(fullSignature);

            if (!truncatedExpected.equals(payload.getSig())) {
                log.error("QR signature mismatch: expected {}, got {}", truncatedExpected, payload.getSig());
                return QrVerificationResponse.failure(
                        VerificationStatus.SIGNATURE_INVALID,
                        "Signature invalide. Ce QR code est falsifié.",
                        "QR_SIGNATURE_INVALID"
                );
            }

            // Now verify against database
            QrVerificationRequest request = QrVerificationRequest.builder()
                    .token(payload.getToken())
                    .signature(fullSignature)
                    .trackingRef(payload.getRef())
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            return verifyQrCode(request);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid QR format from IP {}: {}", clientIp, e.getMessage());
            return QrVerificationResponse.failure(
                    VerificationStatus.TOKEN_NOT_FOUND,
                    "Format de QR code invalide.",
                    "QR_INVALID_FORMAT"
            );
        }
    }

    @Override
    public boolean isValidToken(String token) {
        return tokenRepository.findByTokenAndValidTrue(token).isPresent();
    }

    // ==================== SIGNATURE OPERATIONS ====================

    @Override
    public String generateSignature(String data) {
        try {
            Mac hmac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                    secretKey.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            hmac.init(keySpec);

            byte[] hash = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);

        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to generate HMAC signature", e);
            throw new RuntimeException("Signature generation failed", e);
        }
    }

    @Override
    public boolean verifySignature(String data, String signature) {
        String expectedSignature = generateSignature(data);
        return expectedSignature.equals(signature);
    }

    // ==================== TOKEN MANAGEMENT ====================

    @Override
    @Transactional
    public void revokeToken(String token, String reason) {
        QrVerificationToken tokenEntity = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Token not found", ErrorCode.QR_CODE_INVALID));

        tokenEntity.revoke(reason);
        tokenRepository.save(tokenEntity);

        log.info("Revoked token {} for reason: {}", tokenEntity.getId(), reason);
    }

    @Override
    @Transactional
    public void revokeAllTokensForParcel(UUID parcelId, String reason) {
        int count = tokenRepository.invalidateAllTokensForParcel(parcelId, reason);
        log.info("Revoked {} tokens for parcel {} with reason: {}", count, parcelId, reason);
    }

    @Override
    @Transactional
    public void revokeAllTokensForPickup(UUID pickupId, String reason) {
        int count = tokenRepository.invalidateAllTokensForPickup(pickupId, reason);
        log.info("Revoked {} tokens for pickup {} with reason: {}", count, pickupId, reason);
    }

    @Override
    public QrVerificationToken getValidTokenForParcel(UUID parcelId) {
        return tokenRepository.findByParcel_IdAndTokenTypeAndValidTrue(parcelId, QrTokenType.PERMANENT)
                .orElse(null);
    }

    @Override
    public QrVerificationToken getValidTokenForPickup(UUID pickupId) {
        return tokenRepository.findByPickup_IdAndTokenTypeAndValidTrue(pickupId, QrTokenType.TEMPORARY)
                .orElse(null);
    }

    @Override
    @Transactional
    public int cleanupExpiredTokens() {
        Instant cutoff = Instant.now().minus(7, ChronoUnit.DAYS);
        int deleted = tokenRepository.deleteExpiredTokens(cutoff);
        log.info("Cleaned up {} expired tokens", deleted);
        return deleted;
    }

    // ==================== PRIVATE HELPERS ====================

    private String generateSecureRandomToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[TOKEN_LENGTH];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String truncateSignature(String fullSignature) {
        if (fullSignature.length() <= SIGNATURE_LENGTH) {
            return fullSignature;
        }
        return fullSignature.substring(0, SIGNATURE_LENGTH);
    }

    private String buildSignableData(QrVerificationToken token) {
        String type = token.getTokenType() == QrTokenType.PERMANENT ? "P" : "T";
        String ref = token.getParcel().getTrackingRef();
        if (token.getTokenType() == QrTokenType.TEMPORARY) {
            ref = "TMP-" + ref;
        }
        return String.format("V%d|%s|%s|%s|%d", 
                QR_PAYLOAD_VERSION, type, token.getToken(), ref, 
                token.getCreatedAt().getEpochSecond());
    }

    private QrVerificationResponse buildSuccessResponse(QrVerificationToken token) {
        Parcel parcel = token.getParcel();
        PickupRequest pickup = token.getPickup();

        QrVerificationResponse.QrVerificationResponseBuilder builder = QrVerificationResponse.builder()
                .valid(true)
                .status(VerificationStatus.VALID)
                .message("QR code vérifié avec succès.")
                .tokenId(token.getId())
                .tokenType(token.getTokenType().name())
                .tokenCreatedAt(token.getCreatedAt())
                .tokenExpiresAt(token.getExpiresAt())
                .verificationCount(token.getVerificationCount())
                .verifiedAt(Instant.now())
                .tamperingDetected(false)
                .riskLevel("LOW");

        if (parcel != null) {
            builder.parcelId(parcel.getId())
                    .trackingRef(parcel.getTrackingRef())
                    .parcelStatus(parcel.getStatus().name())
                    .serviceType(parcel.getServiceType().name())
                    .weight(parcel.getWeight())
                    .dimensions(parcel.getDimensions())
                    .fragile(parcel.isFragile())
                    .clientName(parcel.getClient() != null ? parcel.getClient().getFullName() : null)
                    .originAgency(parcel.getOriginAgency() != null ? 
                            parcel.getOriginAgency().getAgencyName() : null)
                    .destinationAgency(parcel.getDestinationAgency() != null ? 
                            parcel.getDestinationAgency().getAgencyName() : null);
        }

        if (pickup != null) {
            builder.pickupId(pickup.getId())
                    .pickupStatus(pickup.getState().name())
                    .requestedDate(pickup.getRequestedDate() != null ? pickup.getRequestedDate().toString() : null)
                    .timeWindow(pickup.getTimeWindow());
        }

        return builder.build();
    }

    private UserAccount getCurrentUserAccount() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String) {
                String email = (String) auth.getPrincipal();
                return userAccountRepository.findByEmail(email).orElse(null);
            }
        } catch (Exception e) {
            log.debug("Could not get current user for verification logging", e);
        }
        return null;
    }
}
