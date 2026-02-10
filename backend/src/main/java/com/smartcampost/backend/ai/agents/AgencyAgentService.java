package com.smartcampost.backend.ai.agents;

import com.smartcampost.backend.ai.events.ScanEventRecordedEvent;

public interface AgencyAgentService {
    void onScanEventRecorded(ScanEventRecordedEvent event);
}
