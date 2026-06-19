package com.smartcampost.backend.ai.runtime;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record AutomationDiscoveryReport(
        Instant generatedAt,
        int filesScanned,
        Map<String, Integer> domainSignals,
        List<AutomationOpportunity> opportunities
) {}
