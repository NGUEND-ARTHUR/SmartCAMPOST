package com.smartcampost.backend.ai.agents;

import com.smartcampost.backend.ai.events.DeliveryAttemptRecordedEvent;
import com.smartcampost.backend.ai.events.ScanEventRecordedEvent;

/**
 * Risk AI agent: evaluates operational/fraud risks and raises alerts.
 */
public interface RiskAgentService {

    void onScanEventRecorded(ScanEventRecordedEvent event);

    void onDeliveryAttemptRecorded(DeliveryAttemptRecordedEvent event);
}
