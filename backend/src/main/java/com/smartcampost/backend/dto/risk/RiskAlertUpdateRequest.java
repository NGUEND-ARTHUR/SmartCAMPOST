package com.smartcampost.backend.dto.risk;

import com.smartcampost.backend.model.enums.RiskAlertSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RiskAlertUpdateRequest {
    @NotBlank
    private String description;

    @NotNull
    private RiskAlertSeverity severity; // LOW, MEDIUM, HIGH, CRITICAL
}
