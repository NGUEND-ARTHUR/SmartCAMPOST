package com.smartcampost.backend.automation;

import com.smartcampost.backend.model.Address;
import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.LocationRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * Automation B — Parcel status auto-progression via geofencing.
 * Compares courier GPS positions with parcel pickup/delivery address coordinates.
 *
 * Geofence radius: 500 meters (~0.5 km)
 * - Courier near pickup address + parcel is ACCEPTED → mark TAKEN_IN_CHARGE
 * - Courier near delivery address + parcel is IN_TRANSIT/OUT_FOR_DELIVERY → mark OUT_FOR_DELIVERY
 *
 * DUAL MODE:
 * - AUTONOMOUS: @Scheduled every 2 minutes
 * - MANUAL: any authorized role can manually update parcel status at any step
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GeofenceAutoProgressionService {

    private final LocationRepository locationRepository;
    private final ParcelRepository parcelRepository;
    private final NotificationService notificationService;

    private static final double GEOFENCE_RADIUS_KM = 0.5;
    private static final int GPS_FRESHNESS_MINUTES = 5;

    @Scheduled(fixedDelayString = "${smartcampost.automation.geofence.interval-ms:120000}")
    public void runAutonomous() {
        log.debug("[AUTOMATION-B] Running geofence auto-progression (autonomous)");
        checkAllActiveParcels();
    }

    @Transactional
    public Map<String, Integer> checkAllActiveParcels() {
        int pickupProgressions = 0;
        int deliveryProgressions = 0;

        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(GPS_FRESHNESS_MINUTES);
        List<Location> recentLocations = locationRepository.findTop500ByOrderByTimestampDesc();

        Map<String, Location> latestPerCourier = new HashMap<>();
        for (Location loc : recentLocations) {
            if (loc.getUserId() == null || loc.getLatitude() == null || loc.getLongitude() == null) continue;
            if (loc.getTimestamp() != null && loc.getTimestamp().isAfter(cutoff)) {
                latestPerCourier.putIfAbsent(loc.getUserId(), loc);
            }
        }

        if (latestPerCourier.isEmpty()) {
            return Map.of("pickupProgressions", 0, "deliveryProgressions", 0);
        }

        List<Parcel> acceptedParcels = parcelRepository.findByStatusIn(List.of(ParcelStatus.ACCEPTED));
        for (Parcel parcel : acceptedParcels) {
            Double[] pickupCoords = extractCoords(parcel.getSenderAddress());
            if (pickupCoords == null) continue;

            for (Location loc : latestPerCourier.values()) {
                double dist = haversineKm(pickupCoords[0], pickupCoords[1], loc.getLatitude(), loc.getLongitude());
                if (dist <= GEOFENCE_RADIUS_KM) {
                    parcel.setStatus(ParcelStatus.TAKEN_IN_CHARGE);
                    parcelRepository.save(parcel);
                    pickupProgressions++;
                    log.info("[AUTOMATION-B] Parcel {} → TAKEN_IN_CHARGE (courier {} within {}m of pickup)",
                            parcel.getTrackingRef(), loc.getUserId(), Math.round(dist * 1000));
                    try {
                        notificationService.notifyParcelInTransit(parcel);
                    } catch (Exception e) {
                        log.warn("[AUTOMATION-B] Notification failed: {}", e.getMessage());
                    }
                    break;
                }
            }
        }

        List<Parcel> transitParcels = parcelRepository.findByStatusIn(
                List.of(ParcelStatus.IN_TRANSIT, ParcelStatus.ARRIVED_DEST_AGENCY));
        for (Parcel parcel : transitParcels) {
            Double[] deliveryCoords = extractCoords(parcel.getRecipientAddress());
            if (deliveryCoords == null) continue;

            for (Location loc : latestPerCourier.values()) {
                double dist = haversineKm(deliveryCoords[0], deliveryCoords[1], loc.getLatitude(), loc.getLongitude());
                if (dist <= GEOFENCE_RADIUS_KM) {
                    parcel.setStatus(ParcelStatus.OUT_FOR_DELIVERY);
                    parcelRepository.save(parcel);
                    deliveryProgressions++;
                    log.info("[AUTOMATION-B] Parcel {} → OUT_FOR_DELIVERY (courier {} within {}m of delivery)",
                            parcel.getTrackingRef(), loc.getUserId(), Math.round(dist * 1000));
                    try {
                        notificationService.notifyParcelOutForDelivery(parcel);
                    } catch (Exception e) {
                        log.warn("[AUTOMATION-B] Notification failed: {}", e.getMessage());
                    }
                    break;
                }
            }
        }

        log.info("[AUTOMATION-B] Progressions: {} pickup, {} delivery", pickupProgressions, deliveryProgressions);
        return Map.of("pickupProgressions", pickupProgressions, "deliveryProgressions", deliveryProgressions);
    }

    /**
     * Manual override: check geofence for a specific parcel.
     */
    @Transactional
    public String checkSingleParcel(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + parcelId));

        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(GPS_FRESHNESS_MINUTES);
        List<Location> recentLocations = locationRepository.findTop500ByOrderByTimestampDesc();

        Double[] targetCoords;
        String targetType;
        ParcelStatus nextStatus;

        if (parcel.getStatus() == ParcelStatus.ACCEPTED) {
            targetCoords = extractCoords(parcel.getSenderAddress());
            targetType = "pickup";
            nextStatus = ParcelStatus.TAKEN_IN_CHARGE;
        } else if (parcel.getStatus() == ParcelStatus.IN_TRANSIT || parcel.getStatus() == ParcelStatus.ARRIVED_DEST_AGENCY) {
            targetCoords = extractCoords(parcel.getRecipientAddress());
            targetType = "delivery";
            nextStatus = ParcelStatus.OUT_FOR_DELIVERY;
        } else {
            return "Parcel status " + parcel.getStatus() + " is not eligible for geofence progression";
        }

        if (targetCoords == null) {
            return "No coordinates available for " + targetType + " address";
        }

        for (Location loc : recentLocations) {
            if (loc.getTimestamp() == null || loc.getTimestamp().isBefore(cutoff)) continue;
            if (loc.getLatitude() == null || loc.getLongitude() == null) continue;

            double dist = haversineKm(targetCoords[0], targetCoords[1], loc.getLatitude(), loc.getLongitude());
            if (dist <= GEOFENCE_RADIUS_KM) {
                parcel.setStatus(nextStatus);
                parcelRepository.save(parcel);
                return "Progressed to " + nextStatus + " — courier " + loc.getUserId() + " is " + Math.round(dist * 1000) + "m from " + targetType;
            }
        }

        return "No courier found within geofence of " + targetType + " address";
    }

    private Double[] extractCoords(Address address) {
        if (address == null) return null;
        BigDecimal lat = address.getLatitude();
        BigDecimal lng = address.getLongitude();
        if (lat == null || lng == null) return null;
        return new Double[]{lat.doubleValue(), lng.doubleValue()};
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
}
