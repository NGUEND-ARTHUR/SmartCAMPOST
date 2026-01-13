package com.smartcampost.backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for AI delivery prediction
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPredictionRequest {
    private String originCity;
    private String destinationCity;
    private Double originLat;
    private Double originLng;
    private Double destinationLat;
    private Double destinationLng;
    private String serviceType;
    private Double weight;
    private Boolean fragile;
}
