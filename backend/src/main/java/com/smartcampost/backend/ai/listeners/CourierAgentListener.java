package com.smartcampost.backend.ai.listeners;

import com.smartcampost.backend.ai.agents.CourierAgentService;
import com.smartcampost.backend.ai.events.DeliveryAttemptRecordedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CourierAgentListener {

    private final CourierAgentService courierAgentService;

    @EventListener
    public void onDeliveryAttemptRecorded(DeliveryAttemptRecordedEvent event) {
        courierAgentService.onDeliveryAttemptRecorded(event);
    }
}
