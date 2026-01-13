package com.smartcampost.backend.dto.ai;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class RouteOptimizationResponse {

    private List<OptimizedStop> optimizedRoute;
    private Double totalDistanceKm;
    private Long estimatedDurationMinutes;
    private Double fuelSavingsPercent;
    private String optimizationStrategy;

    @Data
    @Builder
    public static class OptimizedStop {
        private String id;
        private Integer order;
        private String type;
        private Double latitude;
        private Double longitude;
        private String address;
        private Double distanceFromPrevious;
        private Long etaMinutes;
        private String arrivalTime;
    }
}
