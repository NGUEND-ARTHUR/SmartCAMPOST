package com.smartcampost.backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartNotificationResponse {
    private List<SmartAlert> alerts;
    private Integer totalAlerts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SmartAlert {
        private UUID parcelId;
        private String trackingNumber;
        private String alertType;      // "DELAY_RISK", "STUCK_PARCEL", "DELIVERY_SOON", "WEATHER_IMPACT", "PEAK_CONGESTION"
        private String severity;       // "INFO", "WARNING", "CRITICAL"
        private String message;
        private String recommendation;
    }
}
