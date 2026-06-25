package com.smartcampost.backend.ai.listeners;

import com.smartcampost.backend.ai.events.DeliveryAttemptRecordedEvent;
import com.smartcampost.backend.ai.events.ParcelStatusChangedEvent;
import com.smartcampost.backend.ai.events.ScanEventRecordedEvent;
import com.smartcampost.backend.ai.runtime.AiActorContext;
import com.smartcampost.backend.ai.runtime.AiRuntimeService;
import com.smartcampost.backend.ai.runtime.OperationalEventRequest;
import com.smartcampost.backend.ai.runtime.OperationalEventType;
import com.smartcampost.backend.model.enums.DeliveryAttemptResult;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ScanEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class AiOperationalEventListener {

    private final AiRuntimeService aiRuntimeService;

    @EventListener
    public void onParcelStatusChanged(ParcelStatusChangedEvent event) {
        OperationalEventType type = mapParcelStatus(event.newStatus());
        aiRuntimeService.processEvent(new OperationalEventRequest(
                type,
                "domain-event",
                "PARCEL",
                event.parcelId() != null ? event.parcelId().toString() : null,
                systemActor(),
                mapOf(
                        "previousStatus", event.previousStatus() != null ? event.previousStatus().name() : null,
                        "newStatus", event.newStatus() != null ? event.newStatus().name() : null,
                        "changedAt", event.changedAt() != null ? event.changedAt().toString() : Instant.now().toString()
                ),
                event.parcelId() != null ? event.parcelId().toString() : null,
                Instant.now()
        ));
    }

    @EventListener
    public void onDeliveryAttemptRecorded(DeliveryAttemptRecordedEvent event) {
        OperationalEventType type = event.result() == DeliveryAttemptResult.SUCCESS
                ? OperationalEventType.DELIVERY_COMPLETED
                : OperationalEventType.DELIVERY_DELAYED;
        aiRuntimeService.processEvent(new OperationalEventRequest(
                type,
                "domain-event",
                "PARCEL",
                event.parcelId() != null ? event.parcelId().toString() : null,
                systemActor(),
                mapOf(
                        "attemptNumber", event.attemptNumber(),
                        "result", event.result() != null ? event.result().name() : null,
                        "failureReason", event.failureReason(),
                        "attemptedAt", event.attemptedAt() != null ? event.attemptedAt().toString() : Instant.now().toString()
                ),
                event.attemptId() != null ? event.attemptId().toString() : null,
                Instant.now()
        ));
    }

    @EventListener
    public void onScanEventRecorded(ScanEventRecordedEvent event) {
        OperationalEventType type = mapScanEvent(event.eventType());
        aiRuntimeService.processEvent(new OperationalEventRequest(
                type,
                "domain-event",
                "PARCEL",
                event.parcelId() != null ? event.parcelId().toString() : null,
                systemActor(),
                mapOf(
                        "scanEventId", event.scanEventId() != null ? event.scanEventId().toString() : null,
                        "eventType", event.eventType() != null ? event.eventType().name() : null,
                        "agencyId", event.agencyId() != null ? event.agencyId().toString() : null,
                        "agentId", event.agentId() != null ? event.agentId().toString() : null,
                        "actorId", event.actorId(),
                        "actorRole", event.actorRole(),
                        "timestamp", event.timestamp() != null ? event.timestamp().toString() : Instant.now().toString()
                ),
                event.scanEventId() != null ? event.scanEventId().toString() : null,
                Instant.now()
        ));
    }

    private OperationalEventType mapParcelStatus(ParcelStatus status) {
        if (status == null) {
            return OperationalEventType.SYSTEM_ALERT;
        }
        return switch (status) {
            case CREATED -> OperationalEventType.PARCEL_CREATED;
            case ACCEPTED, TAKEN_IN_CHARGE, IN_TRANSIT, ARRIVED_HUB, ARRIVED_DEST_AGENCY -> OperationalEventType.COURIER_ASSIGNED;
            case OUT_FOR_DELIVERY -> OperationalEventType.DELIVERY_STARTED;
            case DELIVERED, PICKED_UP_AT_AGENCY -> OperationalEventType.DELIVERY_COMPLETED;
            case RETURNED_TO_SENDER, RETURNED, CANCELLED -> OperationalEventType.SYSTEM_ALERT;
        };
    }

    private OperationalEventType mapScanEvent(ScanEventType eventType) {
        if (eventType == null) {
            return OperationalEventType.SYSTEM_ALERT;
        }
        return switch (eventType) {
            case CREATED -> OperationalEventType.PARCEL_CREATED;
            case ACCEPTED, AT_ORIGIN_AGENCY, TAKEN_IN_CHARGE, IN_TRANSIT, ARRIVED_HUB, DEPARTED_HUB, ARRIVED_DESTINATION, ARRIVED_DEST_AGENCY -> OperationalEventType.COURIER_ASSIGNED;
            case OUT_FOR_DELIVERY -> OperationalEventType.DELIVERY_STARTED;
            case DELIVERED, PICKED_UP_AT_AGENCY -> OperationalEventType.DELIVERY_COMPLETED;
            case RETURNED, RETURNED_TO_SENDER, DELIVERY_FAILED, RESCHEDULED, CANCELLED, OTP_SENT, OTP_VERIFIED, PROOF_CAPTURED -> OperationalEventType.SYSTEM_ALERT;
            case PAYMENT_CONFIRMED -> OperationalEventType.PAYMENT_RECEIVED;
        };
    }

    private AiActorContext systemActor() {
        return new AiActorContext(null, "system", "SYSTEM", Set.of("ai:system"));
    }

    private Map<String, Object> mapOf(Object... entries) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        for (int i = 0; i + 1 < entries.length; i += 2) {
            map.put(String.valueOf(entries[i]), entries[i + 1]);
        }
        return map;
    }
}