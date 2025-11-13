package com.smartcampost.backend.service;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public interface ComplianceService {

    Map<String, Object> reviewAnomalies(LocalDate from, LocalDate to);

    void freezeClientAccount(UUID clientId);

    void unfreezeClientAccount(UUID clientId);

    Map<String, Object> generateComplianceReport(LocalDate from, LocalDate to);
}
