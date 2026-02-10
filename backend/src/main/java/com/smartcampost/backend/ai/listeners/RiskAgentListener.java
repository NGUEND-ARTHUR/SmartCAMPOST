package com.smartcampost.backend.ai.listeners;

import com.smartcampost.backend.ai.agents.RiskAgentService;
import com.smartcampost.backend.ai.events.DeliveryAttemptRecordedEvent;
import com.smartcampost.backend.ai.events.ScanEventRecordedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RiskAgentListener {

    private final RiskAgentService riskAgentService;

    @EventListener
    public void onScanEventRecorded(ScanEventRecordedEvent event) {
        riskAgentService.onScanEventRecorded(event);
    }

    @EventListener
    public void onDeliveryAttemptRecorded(DeliveryAttemptRecordedEvent event) {
        riskAgentService.onDeliveryAttemptRecorded(event);
    }
}
