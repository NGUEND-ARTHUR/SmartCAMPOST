package com.smartcampost.backend.ai.events;

import com.smartcampost.backend.model.enums.DeliveryAttemptResult;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event emitted when a DeliveryAttempt is recorded.
 */
public record DeliveryAttemptRecordedEvent(
        UUID attemptId,
        UUID parcelId,
        UUID courierId,
        int attemptNumber,
        DeliveryAttemptResult result,
        String failureReason,
        Instant attemptedAt
) {}
