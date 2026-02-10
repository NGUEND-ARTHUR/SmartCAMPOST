package com.smartcampost.backend.ai;

import com.smartcampost.backend.ai.agents.impl.RiskAgentServiceImpl;
import com.smartcampost.backend.ai.events.DeliveryAttemptRecordedEvent;
import com.smartcampost.backend.ai.events.ScanEventRecordedEvent;
import com.smartcampost.backend.dto.analytics.EtaPredictionResponse;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.RiskAlert;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.RiskAlertType;
import com.smartcampost.backend.model.enums.RiskSeverity;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.repository.DeliveryAttemptRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.RiskAlertRepository;
import com.smartcampost.backend.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskAgentServiceImplTest {

    @Mock ParcelRepository parcelRepository;
    @Mock RiskAlertRepository riskAlertRepository;
    @Mock DeliveryAttemptRepository deliveryAttemptRepository;
    @Mock AnalyticsService analyticsService;

    @InjectMocks RiskAgentServiceImpl riskAgentService;

    @Captor ArgumentCaptor<RiskAlert> riskAlertCaptor;

    @Test
    void onScanEventRecorded_overdueEta_createsDeliveryDelayAlert() {
        UUID parcelId = UUID.randomUUID();
        UUID scanEventId = UUID.randomUUID();

        Parcel parcel = Parcel.builder().id(parcelId).status(ParcelStatus.OUT_FOR_DELIVERY).build();
        when(parcelRepository.findById(parcelId)).thenReturn(Optional.of(parcel));

        Instant predicted = Instant.now().minus(25, ChronoUnit.HOURS);
        when(analyticsService.predictEtaForParcel(parcelId)).thenReturn(
                EtaPredictionResponse.builder().parcelId(parcelId).predictedDeliveryAt(predicted).confidence(0.7).build()
        );

        when(riskAlertRepository.findTopByParcel_IdAndAlertTypeAndResolvedFalseOrderByCreatedAtDesc(
                parcelId, RiskAlertType.DELIVERY_DELAY
        )).thenReturn(Optional.empty());

        when(riskAlertRepository.save(any(RiskAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        riskAgentService.onScanEventRecorded(new ScanEventRecordedEvent(
                scanEventId,
                parcelId,
                ScanEventType.IN_TRANSIT,
                Instant.now(),
                null,
                null,
                null,
                null
        ));

        verify(riskAlertRepository, atLeastOnce()).save(riskAlertCaptor.capture());
        RiskAlert saved = riskAlertCaptor.getAllValues().stream()
                .filter(a -> a.getAlertType() == RiskAlertType.DELIVERY_DELAY)
                .findFirst()
                .orElseThrow();

        assertThat(saved.getSeverity()).isEqualTo(RiskSeverity.HIGH);
        assertThat(saved.getDescription()).contains("ETA").contains("overdue");
    }

    @Test
    void onDeliveryAttemptRecorded_multipleFailures_createsRepeatedFailureAlert() {
        UUID parcelId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();

        Parcel parcel = Parcel.builder().id(parcelId).status(ParcelStatus.OUT_FOR_DELIVERY).build();
        when(parcelRepository.findById(parcelId)).thenReturn(Optional.of(parcel));
        when(deliveryAttemptRepository.countFailedAttempts(parcelId)).thenReturn(3);

        when(analyticsService.predictEtaForParcel(parcelId)).thenReturn(
                EtaPredictionResponse.builder().parcelId(parcelId).predictedDeliveryAt(Instant.now().plus(2, ChronoUnit.HOURS)).confidence(0.7).build()
        );

        when(riskAlertRepository.findTopByParcel_IdAndAlertTypeAndResolvedFalseOrderByCreatedAtDesc(
                parcelId, RiskAlertType.REPEATED_DELIVERY_FAILURE
        )).thenReturn(Optional.empty());

        when(riskAlertRepository.save(any(RiskAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        riskAgentService.onDeliveryAttemptRecorded(new DeliveryAttemptRecordedEvent(
                attemptId,
                parcelId,
                UUID.randomUUID(),
                3,
                com.smartcampost.backend.model.enums.DeliveryAttemptResult.FAILED_OTHER,
                "Recipient unavailable",
                Instant.now()
        ));

        verify(riskAlertRepository, atLeastOnce()).save(riskAlertCaptor.capture());
        RiskAlert saved = riskAlertCaptor.getAllValues().stream()
                .filter(a -> a.getAlertType() == RiskAlertType.REPEATED_DELIVERY_FAILURE)
                .findFirst()
                .orElseThrow();

        assertThat(saved.getSeverity()).isEqualTo(RiskSeverity.HIGH);
        assertThat(saved.getDescription()).contains("failedAttempts=3");
    }
}
