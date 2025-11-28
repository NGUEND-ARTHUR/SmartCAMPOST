package com.smartcampost.backend.dto.analytics;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EtaPredictionResponse {

    private UUID parcelId;
    private String trackingRef;
    private Instant predictedDeliveryAt;
    private Double confidence; // 0-1
}