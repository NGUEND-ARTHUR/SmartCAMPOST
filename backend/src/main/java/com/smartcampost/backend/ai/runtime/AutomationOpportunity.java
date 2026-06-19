package com.smartcampost.backend.ai.runtime;

import java.util.List;

public record AutomationOpportunity(
        String key,
        String domain,
        String detectedFrom,
        String eventTrigger,
        String recommendedTool,
        String strategy,
        List<String> evidence,
        boolean approvalRequired
) {}
