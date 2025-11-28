package com.smartcampost.backend.dto.analytics;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnomalyCheckResponse {

    private boolean anomalous;
    private String reason;
    private Double score;
}