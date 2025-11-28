package com.smartcampost.backend.repository;
import com.smartcampost.backend.model.RiskAlert;
import com.smartcampost.backend.model.enums.RiskSeverity;
import com.smartcampost.backend.model.enums.RiskType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RiskAlertRepository extends JpaRepository<RiskAlert, UUID> {

    List<RiskAlert> findByType(RiskType type);

    List<RiskAlert> findBySeverity(RiskSeverity severity);

    List<RiskAlert> findByResolvedFalse();
}