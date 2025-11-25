package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.OtpCode;
import com.smartcampost.backend.model.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface OtpCodeRepository extends JpaRepository<OtpCode, UUID> {

    // Pour le cooldown : dernier OTP envoyé pour ce phone + purpose
    Optional<OtpCode> findTopByPhoneAndPurposeOrderByCreatedAtDesc(
            String phone,
            OtpPurpose purpose
    );

    // Pour valider un OTP actif
    Optional<OtpCode> findTopByPhoneAndPurposeAndUsedIsFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phone,
            OtpPurpose purpose,
            Instant now
    );
}
