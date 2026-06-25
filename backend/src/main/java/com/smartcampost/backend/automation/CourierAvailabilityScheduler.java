package com.smartcampost.backend.automation;

import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.*;

/**
 * Automation D — Courier availability auto-management.
 * Detects couriers whose GPS heartbeat stopped (no ping in last 10 minutes).
 *
 * DUAL MODE:
 * - AUTONOMOUS: @Scheduled every 5 minutes
 * - MANUAL: call detectUnavailableCouriers() via AutomationManualController
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CourierAvailabilityScheduler {

    private final LocationRepository locationRepository;

    private static final int HEARTBEAT_TIMEOUT_MINUTES = 10;

    private final Set<String> unavailableCouriers = Collections.synchronizedSet(new HashSet<>());

    @Scheduled(fixedDelayString = "${smartcampost.automation.courier-availability.interval-ms:300000}")
    public void runAutonomous() {
        log.debug("[AUTOMATION-D] Running courier availability check (autonomous)");
        detectUnavailableCouriers();
    }

    public Map<String, Object> detectUnavailableCouriers() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(HEARTBEAT_TIMEOUT_MINUTES);
        List<Location> recentLocations = locationRepository.findTop500ByOrderByTimestampDesc();

        Map<String, OffsetDateTime> latestPingPerCourier = new HashMap<>();
        for (Location loc : recentLocations) {
            if (loc.getUserId() == null) continue;
            latestPingPerCourier.merge(loc.getUserId(), loc.getTimestamp(),
                    (a, b) -> a.isAfter(b) ? a : b);
        }

        List<String> newlyUnavailable = new ArrayList<>();
        List<String> nowAvailable = new ArrayList<>();

        for (Map.Entry<String, OffsetDateTime> entry : latestPingPerCourier.entrySet()) {
            String courierId = entry.getKey();
            boolean isStale = entry.getValue().isBefore(cutoff);

            if (isStale && unavailableCouriers.add(courierId)) {
                newlyUnavailable.add(courierId);
                log.warn("[AUTOMATION-D] Courier {} marked UNAVAILABLE — last ping: {}", courierId, entry.getValue());
            } else if (!isStale && unavailableCouriers.remove(courierId)) {
                nowAvailable.add(courierId);
                log.info("[AUTOMATION-D] Courier {} back AVAILABLE", courierId);
            }
        }

        return Map.of(
                "totalTracked", latestPingPerCourier.size(),
                "unavailable", unavailableCouriers.size(),
                "newlyUnavailable", newlyUnavailable,
                "newlyAvailable", nowAvailable
        );
    }

    public Set<String> getUnavailableCouriers() {
        return Collections.unmodifiableSet(unavailableCouriers);
    }

    /**
     * Manual override: toggle courier availability.
     */
    public void manualSetAvailability(String courierId, boolean available) {
        if (available) {
            unavailableCouriers.remove(courierId);
            log.info("[AUTOMATION-D] Courier {} manually set AVAILABLE", courierId);
        } else {
            unavailableCouriers.add(courierId);
            log.info("[AUTOMATION-D] Courier {} manually set UNAVAILABLE", courierId);
        }
    }
}
