package com.smartcampost.backend.service.ai.agents;

import com.smartcampost.backend.dto.ai.RouteOptimizationRequest;
import com.smartcampost.backend.dto.ai.RouteOptimizationResponse;
import com.smartcampost.backend.service.ai.util.GeoMath;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class RouteOptimizationAgent {

    public RouteOptimizationResponse optimize(RouteOptimizationRequest request) {
        List<RouteOptimizationRequest.Stop> stops = request.getStops();
        if (stops == null || stops.isEmpty()) {
            return RouteOptimizationResponse.builder()
                    .optimizedRoute(Collections.emptyList())
                    .totalDistanceKm(0.0)
                    .estimatedDurationMinutes(0L)
                    .fuelSavingsPercent(0.0)
                    .optimizationStrategy(request.getOptimizationStrategy())
                    .build();
        }

        log.info("Optimizing route for {} stops", stops.size());

        double currentLat = request.getCourierLat() != null ? request.getCourierLat() :
                stops.stream().findFirst().map(RouteOptimizationRequest.Stop::getLatitude)
                        .orElseThrow(() -> new IllegalStateException("stops cannot be empty"));
        double currentLng = request.getCourierLng() != null ? request.getCourierLng() :
                stops.stream().findFirst().map(RouteOptimizationRequest.Stop::getLongitude)
                        .orElseThrow(() -> new IllegalStateException("stops cannot be empty"));

        List<RouteOptimizationResponse.OptimizedStop> optimizedRoute = new ArrayList<>();
        List<RouteOptimizationRequest.Stop> remaining = new ArrayList<>(stops);
        double totalDistance = 0;
        long totalMinutes = 0;
        LocalDateTime currentTime = LocalDateTime.now();

        int order = 1;
        while (!remaining.isEmpty()) {
            int nearestIndex = 0;
            double nearestScore = Double.MAX_VALUE;
            for (int i = 0; i < remaining.size(); i++) {
                RouteOptimizationRequest.Stop stop = remaining.get(i);
                double distance = GeoMath.haversineKm(currentLat, currentLng, stop.getLatitude(), stop.getLongitude());
                double score = distance;
                if ("BALANCED".equals(request.getOptimizationStrategy()) && stop.getPriority() != null) {
                    score = distance / (1 + stop.getPriority() * 0.2);
                }
                if (score < nearestScore) {
                    nearestScore = score;
                    nearestIndex = i;
                }
            }

            RouteOptimizationRequest.Stop nearest = remaining.remove(nearestIndex);
            double distance = GeoMath.haversineKm(currentLat, currentLng, nearest.getLatitude(), nearest.getLongitude());
            long etaMinutes = (long) ((distance / 30.0) * 60);

            currentTime = currentTime.plusMinutes(etaMinutes);
            totalDistance += distance;
            totalMinutes += etaMinutes;

            optimizedRoute.add(RouteOptimizationResponse.OptimizedStop.builder()
                    .id(nearest.getId())
                    .order(order++)
                    .type(nearest.getType())
                    .latitude(nearest.getLatitude())
                    .longitude(nearest.getLongitude())
                    .address(nearest.getAddress())
                    .distanceFromPrevious(Math.round(distance * 100.0) / 100.0)
                    .etaMinutes(etaMinutes)
                    .arrivalTime(currentTime.format(DateTimeFormatter.ofPattern("HH:mm")))
                    .build());

            currentLat = nearest.getLatitude();
            currentLng = nearest.getLongitude();
        }

        double originalDistance = calculateOriginalRouteDistance(request.getCourierLat(), request.getCourierLng(), stops);
        double savings = originalDistance > 0 ? ((originalDistance - totalDistance) / originalDistance) * 100 : 0;

        return RouteOptimizationResponse.builder()
                .optimizedRoute(optimizedRoute)
                .totalDistanceKm(Math.round(totalDistance * 100.0) / 100.0)
                .estimatedDurationMinutes(totalMinutes)
                .fuelSavingsPercent(Math.max(0, Math.round(savings * 10.0) / 10.0))
                .optimizationStrategy(request.getOptimizationStrategy() != null ? request.getOptimizationStrategy() : "SHORTEST")
                .build();
    }

    private double calculateOriginalRouteDistance(Double startLat, Double startLng, List<RouteOptimizationRequest.Stop> stops) {
        if (stops == null || stops.isEmpty()) return 0;

        double total = 0;
        double currentLat = startLat != null ? startLat :
                stops.stream().findFirst().map(RouteOptimizationRequest.Stop::getLatitude)
                        .orElseThrow(() -> new IllegalStateException("stops cannot be empty"));
        double currentLng = startLng != null ? startLng :
                stops.stream().findFirst().map(RouteOptimizationRequest.Stop::getLongitude)
                        .orElseThrow(() -> new IllegalStateException("stops cannot be empty"));

        for (RouteOptimizationRequest.Stop stop : stops) {
            total += GeoMath.haversineKm(currentLat, currentLng, stop.getLatitude(), stop.getLongitude());
            currentLat = stop.getLatitude();
            currentLng = stop.getLongitude();
        }

        return total;
    }
}
