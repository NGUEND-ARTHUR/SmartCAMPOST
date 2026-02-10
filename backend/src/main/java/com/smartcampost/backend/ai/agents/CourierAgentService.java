package com.smartcampost.backend.ai.agents;

import com.smartcampost.backend.ai.events.DeliveryAttemptRecordedEvent;

public interface CourierAgentService {
    void onDeliveryAttemptRecorded(DeliveryAttemptRecordedEvent event);
}
