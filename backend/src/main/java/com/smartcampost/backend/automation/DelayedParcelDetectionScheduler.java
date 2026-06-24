package com.smartcampost.backend.automation;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Automation C — Delayed parcel detection and escalation.
 * Runs every 15 minutes. Detects parcels whose expected delivery time has passed.
 *
 * DUAL MODE:
 * - AUTONOMOUS: @Scheduled every 15 minutes
 * - MANUAL: call detectAndEscalateDelayedParcels() via AutomationManualController
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DelayedParcelDetectionScheduler {

    private final ParcelRepository parcelRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelayString = "${smartcampost.automation.delayed-parcel.interval-ms:900000}")
    public void runAutonomous() {
        log.info("[AUTOMATION-C] Running delayed parcel detection (autonomous)");
        detectAndEscalateDelayedParcels();
    }

    @Transactional
    public int detectAndEscalateDelayedParcels() {
        Instant now = Instant.now();
        List<Parcel> inTransitParcels = parcelRepository.findByStatusIn(
                List.of(ParcelStatus.IN_TRANSIT, ParcelStatus.OUT_FOR_DELIVERY)
        );

        int delayedCount = 0;
        for (Parcel parcel : inTransitParcels) {
            if (parcel.getExpectedDeliveryAt() == null) continue;
            if (parcel.getExpectedDeliveryAt().isAfter(now)) continue;

            delayedCount++;

            long hoursOverdue = ChronoUnit.HOURS.between(parcel.getExpectedDeliveryAt(), now);

            try {
                notificationService.notifyDeliveryAttemptFailed(
                        parcel, 0,
                        "Parcel is delayed — " + hoursOverdue + " hour(s) past expected delivery time"
                );
            } catch (Exception e) {
                log.warn("[AUTOMATION-C] Failed to send delay notification for parcel {}: {}",
                        parcel.getId(), e.getMessage());
            }

            if (hoursOverdue >= 2) {
                log.warn("[AUTOMATION-C] ESCALATION: Parcel {} is {}h overdue — escalating to admin",
                        parcel.getTrackingRef(), hoursOverdue);
            }
        }

        log.info("[AUTOMATION-C] Detected {} delayed parcels", delayedCount);
        return delayedCount;
    }

    /**
     * Manual override: mark a specific parcel as delayed.
     */
    public void manualMarkDelayed(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + parcelId));
        notificationService.notifyDeliveryAttemptFailed(
                parcel, 0, "Manually flagged as delayed by admin"
        );
        log.info("[AUTOMATION-C] Parcel {} manually marked as delayed", parcel.getTrackingRef());
    }
}
