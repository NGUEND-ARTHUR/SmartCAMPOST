package com.smartcampost.backend.dto.compliance;
import lombok.Data;

@Data
public class ResolveRiskAlertRequest {

    private boolean resolved;
    private String resolutionNote;
}