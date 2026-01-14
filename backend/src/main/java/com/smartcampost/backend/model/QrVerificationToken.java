package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.QrTokenType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity for storing QR code verification tokens.
 * Each QR code has a unique, cryptographically secure token
 * that can only be verified server-side (anti-forgery).
 */
@Entity
@Table(name = "qr_verification_token", indexes = {
        @Index(name = "idx_qr_token", columnList = "token", unique = true),
        @Index(name = "idx_qr_parcel", columnList = "parcel_id"),
        @Index(name = "idx_qr_pickup", columnList = "pickup_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrVerificationToken {

    @Id
    @Column(name = "token_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    /**
     * Unique cryptographically secure token (32 chars Base64 URL-safe)
     * This is the primary anti-forgery identifier
     */
    @Column(name = "token", nullable = false, length = 64, unique = true)
    private String token;

    /**
     * HMAC signature of the token + parcel data for integrity verification
     */
    @Column(name = "signature", nullable = false, length = 128)
    private String signature;

    /**
     * Type of QR code: PERMANENT (for parcels) or TEMPORARY (for pickup requests)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false)
    private QrTokenType tokenType;

    /**
     * Associated parcel (for both permanent and temporary QR codes)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parcel_id",
            referencedColumnName = "parcel_id",
            foreignKey = @ForeignKey(name = "fk_qr_token_parcel")
    )
    private Parcel parcel;

    /**
     * Associated pickup request (for temporary QR codes only)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "pickup_id",
            referencedColumnName = "pickup_id",
            foreignKey = @ForeignKey(name = "fk_qr_token_pickup")
    )
    private PickupRequest pickup;

    /**
     * Token creation timestamp
     */
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /**
     * Token expiration timestamp (null = never expires)
     */
    @Column(name = "expires_at")
    private Instant expiresAt;

    /**
     * Last verification timestamp
     */
    @Column(name = "last_verified_at")
    private Instant lastVerifiedAt;

    /**
     * Number of times this token has been verified
     */
    @Column(name = "verification_count", nullable = false)
    @Builder.Default
    private Integer verificationCount = 0;

    /**
     * Whether the token is still valid (can be revoked)
     */
    @Column(name = "is_valid", nullable = false)
    @Builder.Default
    private boolean valid = true;

    /**
     * Reason for invalidation (if revoked)
     */
    @Column(name = "revocation_reason", length = 255)
    private String revocationReason;

    /**
     * Agent/user who last verified this token
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "last_verified_by",
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_qr_token_verifier")
    )
    private UserAccount lastVerifiedBy;

    /**
     * IP address from which the token was last verified
     */
    @Column(name = "last_verification_ip", length = 45)
    private String lastVerificationIp;

    /**
     * User agent from which the token was last verified
     */
    @Column(name = "last_verification_user_agent", length = 512)
    private String lastVerificationUserAgent;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    /**
     * Check if the token has expired
     */
    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    /**
     * Check if the token is still usable (valid and not expired)
     */
    public boolean isUsable() {
        return valid && !isExpired();
    }

    /**
     * Record a verification event
     */
    public void recordVerification(UserAccount verifier, String ip, String userAgent) {
        this.lastVerifiedAt = Instant.now();
        this.lastVerifiedBy = verifier;
        this.lastVerificationIp = ip;
        this.lastVerificationUserAgent = userAgent;
        this.verificationCount++;
    }

    /**
     * Revoke this token
     */
    public void revoke(String reason) {
        this.valid = false;
        this.revocationReason = reason;
    }
}
