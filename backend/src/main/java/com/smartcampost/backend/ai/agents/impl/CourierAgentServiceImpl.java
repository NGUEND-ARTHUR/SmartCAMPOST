package com.smartcampost.backend.ai.agents.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.ai.agents.CourierAgentService;
import com.smartcampost.backend.ai.events.DeliveryAttemptRecordedEvent;
import com.smartcampost.backend.dto.ai.RouteOptimization;
import com.smartcampost.backend.model.AiAgentRecommendation;
import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import com.smartcampost.backend.repository.AiAgentRecommendationRepository;
import com.smartcampost.backend.service.SelfHealingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourierAgentServiceImpl implements CourierAgentService {

    private final SelfHealingService selfHealingService;
    private final AiAgentRecommendationRepository recommendationRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void onDeliveryAttemptRecorded(DeliveryAttemptRecordedEvent event) {
        Objects.requireNonNull(event, "event is required");
        UUID courierId = event.courierId();
        if (courierId == null) return;

        try {
            RouteOptimization route = selfHealingService.optimizeCourierRoute(courierId);
            if (route == null || route.getOptimizedRoute() == null) return;

            String payloadJson = objectMapper.writeValueAsString(route);
            String summary = "Optimized route with " + route.getTotalDeliveries() + " stops.";

            recommendationRepository.save(AiAgentRecommendation.builder()
                    .moduleType(AiModuleType.COURIER)
                    .subjectType(AiSubjectType.COURIER)
                    .subjectId(courierId)
                    .summary(summary)
                    .payloadJson(payloadJson)
                    .build());
        } catch (Exception ex) {
            // Never break primary flow.
            log.debug("CourierAgent: failed to compute recommendation for courier {}: {}", courierId, ex.getMessage());
        }
    }
}
