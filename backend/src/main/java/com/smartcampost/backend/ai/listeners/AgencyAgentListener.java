package com.smartcampost.backend.ai.listeners;

import com.smartcampost.backend.ai.agents.AgencyAgentService;
import com.smartcampost.backend.ai.events.ScanEventRecordedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AgencyAgentListener {

    private final AgencyAgentService agencyAgentService;

    @EventListener
    public void onScanEventRecorded(ScanEventRecordedEvent event) {
        agencyAgentService.onScanEventRecorded(event);
    }
}
