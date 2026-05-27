package com.smartcampost.backend.ai.runtime;

import java.util.Set;
import java.util.UUID;

public record AiActorContext(
        UUID actorId,
        String principal,
        String role,
        Set<String> permissions
) {}
