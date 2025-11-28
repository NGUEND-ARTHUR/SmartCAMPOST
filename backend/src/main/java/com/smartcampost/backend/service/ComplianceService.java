package com.smartcampost.backend.service;
import com.smartcampost.backend.dto.compliance.ComplianceReportResponse;
import com.smartcampost.backend.dto.compliance.ResolveRiskAlertRequest;
import com.smartcampost.backend.dto.compliance.RiskAlertResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.UUID;

public interface ComplianceService {

    Page<RiskAlertResponse> listRiskAlerts(int page, int size);

    RiskAlertResponse getRiskAlertById(UUID id);

    RiskAlertResponse resolveRiskAlert(UUID id, ResolveRiskAlertRequest request);

    ComplianceReportResponse generateComplianceReport(LocalDate from, LocalDate to);

    void freezeAccount(UUID userId);

    void unfreezeAccount(UUID userId);
}
