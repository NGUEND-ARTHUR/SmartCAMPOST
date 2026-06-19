package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByParcel_IdOrderByTimestampDesc(UUID parcelId);

    boolean existsByParcel_IdAndStatus(UUID parcelId, com.smartcampost.backend.model.enums.PaymentStatus status);

    List<Payment> findByTimestampBetween(Instant from, Instant to);

    Optional<Payment> findFirstByExternalRefOrderByTimestampDesc(String externalRef);
}
