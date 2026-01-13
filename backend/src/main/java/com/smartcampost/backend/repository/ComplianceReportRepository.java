package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.ComplianceReport;
import com.smartcampost.backend.model.enums.ComplianceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ComplianceReportRepository extends JpaRepository<ComplianceReport, UUID> {
    
    List<ComplianceReport> findByStatus(ComplianceStatus status);
    
    List<ComplianceReport> findByPeriodStartBetween(LocalDate start, LocalDate end);
    
    List<ComplianceReport> findByGeneratedByStaffId(UUID staffId);
    
    List<ComplianceReport> findByPeriodStartGreaterThanEqualAndPeriodEndLessThanEqual(
            LocalDate periodStart, LocalDate periodEnd);
}
