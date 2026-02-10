package com.smartcampost.backend.dto.ai;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Route optimization suggestion for a courier.
 */
@Data
@Builder
public class RouteOptimization {
    private UUID courierId;
    private String courierName;
    private List<DeliveryStop> optimizedRoute;
    private double estimatedDuration;
    private double estimatedDistance;
    private int totalDeliveries;
    private String optimizationReason;
}
