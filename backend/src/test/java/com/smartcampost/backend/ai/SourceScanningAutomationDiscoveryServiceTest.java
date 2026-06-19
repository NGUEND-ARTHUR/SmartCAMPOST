package com.smartcampost.backend.ai;

import com.smartcampost.backend.ai.runtime.SourceScanningAutomationDiscoveryService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SourceScanningAutomationDiscoveryServiceTest {

    @Test
    void discover_shouldInferAutomationOpportunitiesFromProjectSource() {
        var report = new SourceScanningAutomationDiscoveryService().discover();

        assertThat(report.filesScanned()).isGreaterThan(0);
        assertThat(report.opportunities())
                .extracting("key")
                .contains("pickup.assignment.optimization", "payment.anomaly.review", "risk.fraud.escalation");
    }
}
