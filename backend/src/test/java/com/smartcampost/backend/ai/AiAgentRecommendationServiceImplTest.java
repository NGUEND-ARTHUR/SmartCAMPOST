package com.smartcampost.backend.ai;

import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.AiAgentRecommendation;
import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import com.smartcampost.backend.repository.AiAgentRecommendationRepository;
import com.smartcampost.backend.service.impl.AiAgentRecommendationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiAgentRecommendationServiceImplTest {

    @Mock AiAgentRecommendationRepository recommendationRepository;

    @InjectMocks AiAgentRecommendationServiceImpl service;

    @Test
    void getLatestForCourier_returnsMappedResponse() {
        UUID courierId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        Instant createdAt = Instant.now();

        AiAgentRecommendation rec = AiAgentRecommendation.builder()
                .id(id)
                .moduleType(AiModuleType.COURIER)
                .subjectType(AiSubjectType.COURIER)
                .subjectId(courierId)
                .summary("s")
                .payloadJson("{}")
                .createdAt(createdAt)
                .build();

        when(recommendationRepository.findTopByModuleTypeAndSubjectTypeAndSubjectIdOrderByCreatedAtDesc(
                AiModuleType.COURIER,
                AiSubjectType.COURIER,
                courierId
        )).thenReturn(Optional.of(rec));

        var resp = service.getLatestForCourier(courierId);
        assertThat(resp.getId()).isEqualTo(id);
        assertThat(resp.getModuleType()).isEqualTo(AiModuleType.COURIER);
        assertThat(resp.getSubjectId()).isEqualTo(courierId);
        assertThat(resp.getPayloadJson()).isEqualTo("{}");
    }

    @Test
    void getLatestForAgency_notFound_throwsResourceNotFound() {
        UUID agencyId = UUID.randomUUID();

        when(recommendationRepository.findTopByModuleTypeAndSubjectTypeAndSubjectIdOrderByCreatedAtDesc(
                AiModuleType.AGENCY,
                AiSubjectType.AGENCY,
                agencyId
        )).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getLatestForAgency(agencyId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
