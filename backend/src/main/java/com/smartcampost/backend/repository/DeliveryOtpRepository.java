package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.DeliveryOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface DeliveryOtpRepository extends JpaRepository<DeliveryOtp, UUID> {

    Optional<DeliveryOtp> findTopByParcelIdAndConsumedFalseOrderByCreatedAtDesc(UUID parcelId);

    void deleteByExpiresAtBefore(Instant cutoff);
}
