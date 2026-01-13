package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.QrVerificationToken;
import com.smartcampost.backend.model.enums.QrTokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QrVerificationTokenRepository extends JpaRepository<QrVerificationToken, UUID> {

    /**
     * Find a token by its unique verification token string
     */
    Optional<QrVerificationToken> findByToken(String token);

    /**
     * Find valid token by token string
     */
    Optional<QrVerificationToken> findByTokenAndValidTrue(String token);

    /**
     * Find all valid tokens for a parcel
     */
    List<QrVerificationToken> findByParcel_IdAndValidTrue(UUID parcelId);

    /**
     * Find the current valid permanent token for a parcel
     */
    Optional<QrVerificationToken> findByParcel_IdAndTokenTypeAndValidTrue(UUID parcelId, QrTokenType tokenType);

    /**
     * Find all tokens for a pickup request
     */
    List<QrVerificationToken> findByPickup_Id(UUID pickupId);

    /**
     * Find valid temporary token for a pickup
     */
    Optional<QrVerificationToken> findByPickup_IdAndTokenTypeAndValidTrue(UUID pickupId, QrTokenType tokenType);

    /**
     * Check if a token exists
     */
    boolean existsByToken(String token);

    /**
     * Invalidate all tokens for a parcel
     */
    @Modifying
    @Query("UPDATE QrVerificationToken t SET t.valid = false, t.revocationReason = :reason " +
            "WHERE t.parcel.id = :parcelId AND t.valid = true")
    int invalidateAllTokensForParcel(@Param("parcelId") UUID parcelId, @Param("reason") String reason);

    /**
     * Invalidate all tokens for a pickup
     */
    @Modifying
    @Query("UPDATE QrVerificationToken t SET t.valid = false, t.revocationReason = :reason " +
            "WHERE t.pickup.id = :pickupId AND t.valid = true")
    int invalidateAllTokensForPickup(@Param("pickupId") UUID pickupId, @Param("reason") String reason);

    /**
     * Clean up expired tokens
     */
    @Modifying
    @Query("DELETE FROM QrVerificationToken t WHERE t.expiresAt < :cutoff")
    int deleteExpiredTokens(@Param("cutoff") Instant cutoff);

    /**
     * Count verification attempts for a token in a time window (rate limiting)
     */
    @Query("SELECT t.verificationCount FROM QrVerificationToken t WHERE t.token = :token")
    Integer getVerificationCount(@Param("token") String token);

    /**
     * Find tokens by parcel tracking reference
     */
    @Query("SELECT t FROM QrVerificationToken t WHERE t.parcel.trackingRef = :trackingRef AND t.valid = true")
    List<QrVerificationToken> findValidTokensByTrackingRef(@Param("trackingRef") String trackingRef);
}
