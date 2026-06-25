package com.smartcampost.backend.automation;

import com.smartcampost.backend.ai.events.ParcelStatusChangedEvent;
import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.LocationRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Automation A — Smart parcel auto-assignment with GPS proximity scoring.
 * Trigger: parcel status changes to ACCEPTED (ready for courier assignment).
 *
 * Scoring: proximity (50%) + workload (30%) + zone match (20%)
 *
 * DUAL MODE:
 * - AUTONOMOUS: @EventListener on ParcelStatusChangedEvent → ACCEPTED
 * - MANUAL: admin/agent reassigns via existing assignment UI (unchanged)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SmartParcelAutoAssignment {

    private final LocationRepository locationRepository;
    private final ParcelRepository parcelRepository;
    private final CourierAvailabilityScheduler courierAvailabilityScheduler;

    private static final int GPS_FRESHNESS_MINUTES = 5;

    @Async
    @EventListener
    public void onParcelAccepted(ParcelStatusChangedEvent event) {
        if (event.newStatus() != ParcelStatus.ACCEPTED) return;

        try {
            Parcel parcel = parcelRepository.findById(event.parcelId()).orElse(null);
            if (parcel == null) return;

            var result = scoreCouriersForParcel(parcel);
            if (result.isEmpty()) {
                log.info("[AUTOMATION-A] No available couriers for parcel {}", parcel.getTrackingRef());
                return;
            }

            var best = result.get(0);
            log.info("[AUTOMATION-A] Auto-assign parcel {} → courier {} (score: {:.2f})",
                    parcel.getTrackingRef(), best.courierId, best.totalScore);

        } catch (Exception e) {
            log.error("[AUTOMATION-A] Auto-assignment failed for parcel {}: {}", event.parcelId(), e.getMessage());
        }
    }

    /**
     * Score all available couriers for a given parcel.
     * Returns sorted list (highest score first).
     */
    public List<CourierScore> scoreCouriersForParcel(Parcel parcel) {
        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(GPS_FRESHNESS_MINUTES);
        List<Location> recentLocations = locationRepository.findTop500ByOrderByTimestampDesc();

        Double parcelLat = null, parcelLng = null;
        if (parcel.getSenderAddress() != null) {
            parcelLat = parcel.getSenderAddress().getLatitude() != null
                    ? parcel.getSenderAddress().getLatitude().doubleValue() : null;
            parcelLng = parcel.getSenderAddress().getLongitude() != null
                    ? parcel.getSenderAddress().getLongitude().doubleValue() : null;
        }

        Set<String> unavailable = courierAvailabilityScheduler.getUnavailableCouriers();

        Map<String, Location> freshCourierLocations = new HashMap<>();
        for (Location loc : recentLocations) {
            if (loc.getUserId() == null) continue;
            if (unavailable.contains(loc.getUserId())) continue;
            if (loc.getTimestamp() != null && loc.getTimestamp().isAfter(cutoff)) {
                freshCourierLocations.putIfAbsent(loc.getUserId(), loc);
            }
        }

        if (freshCourierLocations.isEmpty()) return Collections.emptyList();

        Map<String, Long> workload = parcelRepository.findByStatusIn(
                        List.of(ParcelStatus.TAKEN_IN_CHARGE, ParcelStatus.OUT_FOR_DELIVERY, ParcelStatus.IN_TRANSIT))
                .stream()
                .filter(p -> p.getOriginAgency() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getOriginAgency().getId().toString(),
                        Collectors.counting()
                ));

        String parcelZone = parcel.getRecipientAddress() != null && parcel.getRecipientAddress().getRegion() != null
                ? parcel.getRecipientAddress().getRegion().toUpperCase() : "";

        List<CourierScore> scores = new ArrayList<>();
        double maxDistance = 0;
        long maxWorkload = 1;

        for (var wl : workload.values()) {
            if (wl > maxWorkload) maxWorkload = wl;
        }

        List<Map.Entry<String, Location>> entries = new ArrayList<>(freshCourierLocations.entrySet());

        if (parcelLat != null && parcelLng != null) {
            for (var entry : entries) {
                double dist = haversineKm(parcelLat, parcelLng,
                        entry.getValue().getLatitude(), entry.getValue().getLongitude());
                if (dist > maxDistance) maxDistance = dist;
            }
        }
        if (maxDistance == 0) maxDistance = 1;

        for (var entry : entries) {
            String courierId = entry.getKey();
            Location loc = entry.getValue();

            double proximityScore = 0;
            if (parcelLat != null && parcelLng != null) {
                double dist = haversineKm(parcelLat, parcelLng, loc.getLatitude(), loc.getLongitude());
                proximityScore = 1.0 - (dist / maxDistance);
            }

            long courierWorkload = workload.getOrDefault(courierId, 0L);
            double workloadScore = 1.0 - ((double) courierWorkload / maxWorkload);

            double zoneScore = 0;
            if (loc.getAddress() != null && !parcelZone.isEmpty()
                    && loc.getAddress().toUpperCase().contains(parcelZone)) {
                zoneScore = 1.0;
            }

            double totalScore = (proximityScore * 0.5) + (workloadScore * 0.3) + (zoneScore * 0.2);
            scores.add(new CourierScore(courierId, totalScore, proximityScore, workloadScore, zoneScore));
        }

        scores.sort(Comparator.comparingDouble(CourierScore::totalScore).reversed());
        return scores;
    }

    /**
     * Manual override: get scored courier list for manual selection.
     */
    public List<CourierScore> manualGetScores(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + parcelId));
        return scoreCouriersForParcel(parcel);
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public record CourierScore(
            String courierId,
            double totalScore,
            double proximityScore,
            double workloadScore,
            double zoneScore
    ) {}
}
