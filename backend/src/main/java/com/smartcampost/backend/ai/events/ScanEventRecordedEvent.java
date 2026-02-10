package com.smartcampost.backend.ai.events;

import com.smartcampost.backend.model.enums.ScanEventType;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event emitted when a ScanEvent is recorded.
 */
public record ScanEventRecordedEvent(
        UUID scanEventId,
        UUID parcelId,
        ScanEventType eventType,
        Instant timestamp,
        UUID agencyId,
        UUID agentId,
        String actorId,
        String actorRole
) {}
