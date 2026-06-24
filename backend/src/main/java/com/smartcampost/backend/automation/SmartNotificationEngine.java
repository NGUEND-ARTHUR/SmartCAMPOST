package com.smartcampost.backend.automation;

import com.smartcampost.backend.ai.events.ParcelStatusChangedEvent;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Automation F — Smart notification engine.
 * Fires on every parcel status change (automated or manual) and sends the
 * appropriate notification to the relevant parties.
 *
 * DUAL MODE:
 * - AUTONOMOUS: @EventListener on ParcelStatusChangedEvent
 * - MANUAL: call sendNotificationForStatus() via AutomationManualController
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SmartNotificationEngine {

    private final NotificationService notificationService;
    private final ParcelRepository parcelRepository;

    @Async
    @EventListener
    public void onParcelStatusChanged(ParcelStatusChangedEvent event) {
        try {
            Parcel parcel = parcelRepository.findById(event.parcelId())
                    .orElse(null);
            if (parcel == null) {
                log.warn("[AUTOMATION-F] Parcel {} not found for notification", event.parcelId());
                return;
            }
            sendNotificationForStatus(parcel, event.newStatus());
        } catch (Exception e) {
            log.error("[AUTOMATION-F] Failed to process notification for parcel {}: {}",
                    event.parcelId(), e.getMessage());
        }
    }

    public void sendNotificationForStatus(Parcel parcel, ParcelStatus status) {
        log.info("[AUTOMATION-F] Sending notification for parcel {} → {}", parcel.getTrackingRef(), status);

        try {
            switch (status) {
                case CREATED -> notificationService.notifyParcelCreated(parcel);
                case ACCEPTED -> notificationService.notifyParcelAccepted(parcel);
                case IN_TRANSIT -> notificationService.notifyParcelInTransit(parcel);
                case OUT_FOR_DELIVERY -> notificationService.notifyParcelOutForDelivery(parcel);
                case ARRIVED_DEST_AGENCY -> notificationService.notifyParcelArrivedDestination(parcel);
                case DELIVERED -> notificationService.notifyParcelDelivered(parcel);
                default -> log.debug("[AUTOMATION-F] No specific notification for status {}", status);
            }
        } catch (Exception e) {
            log.error("[AUTOMATION-F] Notification send failed for {} ({}): {}",
                    parcel.getTrackingRef(), status, e.getMessage());
        }
    }

    /**
     * Manual override: trigger notification for any parcel to any party.
     */
    public void manualTrigger(UUID parcelId, ParcelStatus status) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + parcelId));
        log.info("[AUTOMATION-F] MANUAL trigger notification for parcel {} → {}", parcel.getTrackingRef(), status);
        sendNotificationForStatus(parcel, status);
    }
}
