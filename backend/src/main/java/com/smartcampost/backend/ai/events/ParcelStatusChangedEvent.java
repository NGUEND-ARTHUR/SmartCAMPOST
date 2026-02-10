package com.smartcampost.backend.ai.events;

import com.smartcampost.backend.model.enums.ParcelStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event emitted when a Parcel status changes.
 */
public record ParcelStatusChangedEvent(
        UUID parcelId,
        ParcelStatus previousStatus,
        ParcelStatus newStatus,
        Instant changedAt
) {}
