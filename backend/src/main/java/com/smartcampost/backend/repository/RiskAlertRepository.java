package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.RiskAlert;
import com.smartcampost.backend.model.enums.RiskAlertStatus;
import com.smartcampost.backend.model.enums.RiskAlertType;
import com.smartcampost.backend.model.enums.RiskSeverity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface RiskAlertRepository extends JpaRepository<RiskAlert, UUID> {

    List<RiskAlert> findByAlertType(RiskAlertType alertType);

    List<RiskAlert> findBySeverity(RiskSeverity severity);

    List<RiskAlert> findByStatus(RiskAlertStatus status);

    List<RiskAlert> findByResolvedFalse();

    List<RiskAlert> findByParcel_Id(UUID parcelId);

    List<RiskAlert> findByPayment_Id(UUID paymentId);

    List<RiskAlert> findByReviewedByStaff_Id(UUID staffId);

    Optional<RiskAlert> findTopByParcel_IdAndAlertTypeAndResolvedFalseOrderByCreatedAtDesc(
            UUID parcelId,
            RiskAlertType alertType
    );
}