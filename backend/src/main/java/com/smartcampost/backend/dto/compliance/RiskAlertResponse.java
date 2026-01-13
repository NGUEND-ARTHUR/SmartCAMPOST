package com.smartcampost.backend.dto.compliance;

import com.smartcampost.backend.model.enums.RiskAlertStatus;
import com.smartcampost.backend.model.enums.RiskAlertType;
import com.smartcampost.backend.model.enums.RiskSeverity;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RiskAlertResponse {

    private UUID id;
    private RiskAlertType alertType;
    private RiskSeverity severity;
    private RiskAlertStatus status;
    private UUID parcelId;
    private UUID paymentId;
    private String description;
    private boolean resolved;
    private Instant createdAt;
    private Instant updatedAt;
    private UUID reviewedByStaffId;
}