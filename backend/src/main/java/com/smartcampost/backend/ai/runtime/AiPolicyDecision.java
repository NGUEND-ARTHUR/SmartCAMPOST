package com.smartcampost.backend.ai.runtime;

public record AiPolicyDecision(
        boolean allowed,
        boolean requiresApproval,
        String reason
) {}
