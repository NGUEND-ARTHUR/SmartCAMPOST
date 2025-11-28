package com.smartcampost.backend.dto.compliance;
import com.smartcampost.backend.model.enums.RiskSeverity;
import com.smartcampost.backend.model.enums.RiskType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RiskAlertResponse {

    private UUID id;
    private RiskType type;
    private RiskSeverity severity;
    private String entityType;
    private String entityId;
    private String description;
    private boolean resolved;
    private Instant createdAt;
}