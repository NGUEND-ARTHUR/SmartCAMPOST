package com.smartcampost.backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for AI delivery prediction
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPredictionResponse {
    private Integer estimatedDays;
    private String estimatedDeliveryDate;
    private String estimatedDeliveryTime;
    private Double confidence;
    private Double confidenceScore;
    private String message;
    private List<String> factors;
}
