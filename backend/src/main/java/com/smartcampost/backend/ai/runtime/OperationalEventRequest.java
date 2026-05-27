package com.smartcampost.backend.ai.runtime;

import java.time.Instant;
import java.util.Map;

public record OperationalEventRequest(
        OperationalEventType eventType,
        String source,
        String entityType,
        String entityId,
        AiActorContext actor,
        Map<String, Object> payload,
        String correlationId,
        Instant occurredAt
) {}
