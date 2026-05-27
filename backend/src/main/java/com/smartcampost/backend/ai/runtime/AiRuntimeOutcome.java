package com.smartcampost.backend.ai.runtime;

import java.time.Instant;
import java.util.List;

public record AiRuntimeOutcome(
        OperationalEventType eventType,
        String summary,
        boolean interventionRequired,
        List<AiToolResult> actions,
        Instant processedAt
) {}
