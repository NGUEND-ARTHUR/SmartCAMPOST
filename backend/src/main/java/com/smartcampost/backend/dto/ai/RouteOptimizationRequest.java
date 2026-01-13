package com.smartcampost.backend.dto.ai;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class RouteOptimizationRequest {

    @NotEmpty
    private List<Stop> stops;

    private Double courierLat;
    private Double courierLng;

    private String optimizationStrategy; // "SHORTEST", "FASTEST", "BALANCED"

    @Data
    public static class Stop {
        private String id;
        private String type; // "PICKUP" or "DELIVERY"
        private Double latitude;
        private Double longitude;
        private String address;
        private Integer priority; // 1-5, higher is more urgent
        private String timeWindow; // e.g., "09:00-12:00"
    }
}
