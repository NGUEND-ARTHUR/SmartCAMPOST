package com.smartcampost.backend.service;

import java.time.LocalDate;
import java.util.Map;

public interface ReportingService {

    Map<String, Object> getOperationalDashboard(LocalDate from, LocalDate to);

    Map<String, Object> getFinanceSummary(LocalDate from, LocalDate to);

    Map<String, Object> getParcelVolumeByZone(LocalDate from, LocalDate to);
}
