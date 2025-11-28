package com.smartcampost.backend.dto.compliance;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class ComplianceReportResponse {

    private Instant generatedAt;
    private String period; // e.g. "2025-01"
    private Map<String, Object> stats;
}