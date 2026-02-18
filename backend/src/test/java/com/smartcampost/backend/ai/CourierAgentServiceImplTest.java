package com.smartcampost.backend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.ai.agents.impl.CourierAgentServiceImpl;
import com.smartcampost.backend.ai.events.DeliveryAttemptRecordedEvent;
import com.smartcampost.backend.dto.ai.DeliveryStop;
import com.smartcampost.backend.dto.ai.RouteOptimization;
import com.smartcampost.backend.model.AiAgentRecommendation;
import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import com.smartcampost.backend.repository.AiAgentRecommendationRepository;
import com.smartcampost.backend.service.SelfHealingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CourierAgentServiceImplTest {

    @Mock SelfHealingService selfHealingService;
    @Mock AiAgentRecommendationRepository recommendationRepository;
    @Mock ObjectMapper objectMapper;

    @InjectMocks CourierAgentServiceImpl courierAgentService;

    @Captor ArgumentCaptor<AiAgentRecommendation> recommendationCaptor;

    @Test
    void onDeliveryAttemptRecorded_persistsCourierRecommendation() throws Exception {
        UUID courierId = UUID.randomUUID();
        UUID parcelId = UUID.randomUUID();

        RouteOptimization route = RouteOptimization.builder()
                .courierId(courierId)
                .courierName("Courier One")
                .totalDeliveries(2)
                .optimizedRoute(List.of(
                        DeliveryStop.builder().sequence(1).parcelId(parcelId).trackingRef("TRK1").build(),
                        DeliveryStop.builder().sequence(2).parcelId(UUID.randomUUID()).trackingRef("TRK2").build()
                ))
                .optimizationReason("test")
                .build();

        when(selfHealingService.optimizeCourierRoute(courierId)).thenReturn(route);
        when(objectMapper.writeValueAsString(route)).thenReturn("{\"ok\":true}");
        when(recommendationRepository.save(any(AiAgentRecommendation.class))).thenAnswer(inv -> inv.getArgument(0));

        courierAgentService.onDeliveryAttemptRecorded(new DeliveryAttemptRecordedEvent(
                UUID.randomUUID(),
                parcelId,
                courierId,
                1,
                com.smartcampost.backend.model.enums.DeliveryAttemptResult.FAILED_OTHER,
                "fail",
                Instant.now()
        ));

        verify(recommendationRepository).save(recommendationCaptor.capture());
        AiAgentRecommendation saved = recommendationCaptor.getValue();

        assertThat(saved.getModuleType()).isEqualTo(AiModuleType.COURIER);
        assertThat(saved.getSubjectType()).isEqualTo(AiSubjectType.COURIER);
        assertThat(saved.getSubjectId()).isEqualTo(courierId);
        assertThat(saved.getPayloadJson()).contains("ok");
        assertThat(saved.getSummary()).contains("2");
    }
}
