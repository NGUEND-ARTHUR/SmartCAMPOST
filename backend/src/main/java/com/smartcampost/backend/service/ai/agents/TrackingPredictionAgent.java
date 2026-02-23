package com.smartcampost.backend.service.ai.agents;

import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
import com.smartcampost.backend.service.ai.util.GeoMath;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrackingPredictionAgent {

        private final DataOptimizationAgent dataOptimizationAgent;

    public DeliveryPredictionResponse predict(DeliveryPredictionRequest request) {
        String cacheKey = String.format("%s|%s|%s|%s|%s", request.getOriginLat(), request.getOriginLng(),
                request.getDestinationLat(), request.getDestinationLng(), request.getServiceType());

        DeliveryPredictionResponse cached = dataOptimizationAgent.getIfPresent(
                "tracking-predict",
                cacheKey,
                Duration.ofMinutes(2),
                DeliveryPredictionResponse.class
        );
        if (cached != null) return cached;

        double distance = GeoMath.haversineKm(
                request.getOriginLat(), request.getOriginLng(),
                request.getDestinationLat(), request.getDestinationLng()
        );

        // Base hours = distance / 50 km/h average for logistics
        double baseHours = distance / 50;

        // Adjust for service type
        String serviceType = request.getServiceType() != null ? request.getServiceType() : "STANDARD";
        double multiplier = "EXPRESS".equals(serviceType) ? 0.5 : 1.0;

        // Add handling time (2-4 hours for processing)
        double totalHours = (baseHours * multiplier) + 3;

        // Convert to days for display (8-hour work days)
        int estimatedDays = (int) Math.ceil(totalHours / 8);

        // Confidence decreases with distance
        double confidence = Math.max(0.6, 1.0 - (distance / 1000) * 0.1);

        LocalDateTime estimatedDelivery = LocalDateTime.now().plusDays(estimatedDays);
        DeliveryPredictionResponse resp = DeliveryPredictionResponse.builder()
                .estimatedDeliveryDate(estimatedDelivery.toLocalDate().toString())
                .estimatedDeliveryTime(estimatedDelivery.format(DateTimeFormatter.ofPattern("HH:mm")))
                .confidenceScore(Math.round(confidence * 100) / 100.0)
                .factors(Arrays.asList(
                        "Distance: " + Math.round(distance) + " km",
                        "Service: " + serviceType,
                        "Current load: Normal"
                ))
                .build();

        dataOptimizationAgent.put(
                "tracking-predict",
                cacheKey,
                Duration.ofMinutes(2),
                resp
        );
        return resp;
    }
}
