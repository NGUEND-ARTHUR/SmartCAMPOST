package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByParcel_IdOrderByTimestampDesc(UUID parcelId);

    boolean existsByParcel_IdAndStatus(UUID parcelId, com.smartcampost.backend.model.enums.PaymentStatus status);

    List<Payment> findByTimestampBetween(Instant from, Instant to);

    Optional<Payment> findFirstByExternalRefOrderByTimestampDesc(String externalRef);

    // Avoids loading every payment into memory just to sum amounts (used by dashboard revenue metric)
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    double sumAmountByStatus(@Param("status") PaymentStatus status);
}
