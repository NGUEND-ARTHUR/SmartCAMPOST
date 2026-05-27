package com.smartcampost.backend.ai.runtime;

import java.time.Instant;
import java.util.Map;

public record AiToolRequest(
        AiOperatingMode mode,
        String toolName,
        AiActorContext actor,
        Map<String, Object> parameters,
        boolean ownershipVerified,
        boolean approvalGranted,
        String approvalReference,
        String correlationId,
        String sourceEventType,
        Instant requestedAt
) {}
