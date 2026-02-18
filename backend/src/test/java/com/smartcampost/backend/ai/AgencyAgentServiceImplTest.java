package com.smartcampost.backend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.ai.agents.impl.AgencyAgentServiceImpl;
import com.smartcampost.backend.ai.events.ScanEventRecordedEvent;
import com.smartcampost.backend.dto.ai.CongestionAlert;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.AiAgentRecommendation;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.AiAgentRecommendationRepository;
import com.smartcampost.backend.repository.ParcelRepository;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AgencyAgentServiceImplTest {

    @Mock SelfHealingService selfHealingService;
    @Mock AgencyRepository agencyRepository;
    @Mock ParcelRepository parcelRepository;
    @Mock AiAgentRecommendationRepository recommendationRepository;
    @Mock ObjectMapper objectMapper;

    @InjectMocks AgencyAgentServiceImpl agencyAgentService;

    @Captor ArgumentCaptor<AiAgentRecommendation> recommendationCaptor;

    @Test
    void onScanEventRecorded_highCongestion_persistsAgencyRecommendation() throws Exception {
        UUID sourceAgencyId = UUID.randomUUID();
        UUID targetAgencyId = UUID.randomUUID();

        Agency source = Agency.builder().id(sourceAgencyId).agencyName("A").region("Centre").build();
        Agency candidate1 = Agency.builder().id(targetAgencyId).agencyName("B").region("Centre").build();
        Agency candidate2 = Agency.builder().id(UUID.randomUUID()).agencyName("C").region("Centre").build();

        when(selfHealingService.detectCongestionForAgency(sourceAgencyId)).thenReturn(
                CongestionAlert.builder()
                        .agencyId(sourceAgencyId)
                        .agencyName("Agency A")
                        .parcelCount(80)
                        .threshold(50)
                        .congestionLevel(0.85)
                        .detectedAt(Instant.now())
                        .suggestedActions(List.of("redistribute"))
                        .build()
        );

        when(agencyRepository.findById(sourceAgencyId)).thenReturn(Optional.of(source));
        when(agencyRepository.findAll()).thenReturn(List.of(source, candidate1, candidate2));

        // Candidate selection: candidate1 is least loaded
        when(parcelRepository.countByDestinationAgency_IdAndStatusIn(eq(targetAgencyId), anyList())).thenReturn(5L);
        when(parcelRepository.countByDestinationAgency_IdAndStatusIn(eq(candidate2.getId()), anyList())).thenReturn(12L);

        when(parcelRepository.findByDestinationAgency_IdAndStatusIn(eq(sourceAgencyId), anyList())).thenReturn(
                List.of(
                        Parcel.builder().id(UUID.randomUUID()).status(ParcelStatus.ARRIVED_DEST_AGENCY).build(),
                        Parcel.builder().id(UUID.randomUUID()).status(ParcelStatus.ARRIVED_HUB).build()
                )
        );

        when(objectMapper.writeValueAsString(any())).thenReturn("{\"agency\":true}");
        when(recommendationRepository.save(any(AiAgentRecommendation.class))).thenAnswer(inv -> inv.getArgument(0));

        agencyAgentService.onScanEventRecorded(new ScanEventRecordedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                ScanEventType.ARRIVED_DEST_AGENCY,
                Instant.now(),
                sourceAgencyId,
                null,
                "actor",
                "AGENT"
        ));

        verify(recommendationRepository).save(recommendationCaptor.capture());
        AiAgentRecommendation saved = recommendationCaptor.getValue();

        assertThat(saved.getModuleType()).isEqualTo(AiModuleType.AGENCY);
        assertThat(saved.getSubjectType()).isEqualTo(AiSubjectType.AGENCY);
        assertThat(saved.getSubjectId()).isEqualTo(sourceAgencyId);
        assertThat(saved.getPayloadJson()).contains("agency");
        assertThat(saved.getSummary()).contains("Agency");
    }

    @Test
    void onScanEventRecorded_lowCongestion_doesNotPersistRecommendation() {
        UUID sourceAgencyId = UUID.randomUUID();

        when(selfHealingService.detectCongestionForAgency(sourceAgencyId)).thenReturn(
                CongestionAlert.builder()
                        .agencyId(sourceAgencyId)
                        .agencyName("Agency A")
                        .parcelCount(10)
                        .threshold(50)
                        .congestionLevel(0.20)
                        .detectedAt(Instant.now())
                        .suggestedActions(List.of())
                        .build()
        );

        agencyAgentService.onScanEventRecorded(new ScanEventRecordedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                ScanEventType.ARRIVED_HUB,
                Instant.now(),
                sourceAgencyId,
                null,
                "actor",
                "AGENT"
        ));

        verifyNoInteractions(recommendationRepository);
    }
}
