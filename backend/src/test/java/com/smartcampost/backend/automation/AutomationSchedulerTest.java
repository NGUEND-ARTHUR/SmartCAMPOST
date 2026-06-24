package com.smartcampost.backend.automation;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.LocationRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.ai.agents.TrackingPredictionAgent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutomationSchedulerTest {

    @Mock private ParcelRepository parcelRepository;
    @Mock private NotificationService notificationService;
    @Mock private LocationRepository locationRepository;
    @Mock private TrackingPredictionAgent trackingPredictionAgent;

    @InjectMocks private DelayedParcelDetectionScheduler delayedScheduler;
    @InjectMocks private CourierAvailabilityScheduler courierScheduler;
    @InjectMocks private EtaRecalculationScheduler etaScheduler;

    @Test
    void delayedParcelDetection_withOverdueParcel_shouldDetect() {
        Parcel overdue = Parcel.builder()
                .id(UUID.randomUUID())
                .trackingRef("SCP-OVERDUE")
                .status(ParcelStatus.IN_TRANSIT)
                .expectedDeliveryAt(Instant.now().minus(3, ChronoUnit.HOURS))
                .build();
        when(parcelRepository.findByStatusIn(any())).thenReturn(List.of(overdue));

        int count = delayedScheduler.detectAndEscalateDelayedParcels();
        assertEquals(1, count);
        verify(notificationService).notifyDeliveryAttemptFailed(eq(overdue), eq(0), any());
    }

    @Test
    void delayedParcelDetection_withOnTimeParcel_shouldNotDetect() {
        Parcel onTime = Parcel.builder()
                .id(UUID.randomUUID())
                .trackingRef("SCP-ONTIME")
                .status(ParcelStatus.IN_TRANSIT)
                .expectedDeliveryAt(Instant.now().plus(2, ChronoUnit.HOURS))
                .build();
        when(parcelRepository.findByStatusIn(any())).thenReturn(List.of(onTime));

        int count = delayedScheduler.detectAndEscalateDelayedParcels();
        assertEquals(0, count);
        verify(notificationService, never()).notifyDeliveryAttemptFailed(any(), anyInt(), any());
    }

    @Test
    void delayedParcelDetection_withNullEta_shouldSkip() {
        Parcel noEta = Parcel.builder()
                .id(UUID.randomUUID())
                .trackingRef("SCP-NO-ETA")
                .status(ParcelStatus.IN_TRANSIT)
                .expectedDeliveryAt(null)
                .build();
        when(parcelRepository.findByStatusIn(any())).thenReturn(List.of(noEta));

        int count = delayedScheduler.detectAndEscalateDelayedParcels();
        assertEquals(0, count);
    }

    @Test
    void courierAvailability_withNoLocations_shouldReturnEmpty() {
        when(locationRepository.findTop500ByOrderByTimestampDesc()).thenReturn(List.of());

        var result = courierScheduler.detectUnavailableCouriers();
        assertEquals(0, result.get("totalTracked"));
    }

    @Test
    void courierAvailability_manualToggle_shouldWork() {
        courierScheduler.manualSetAvailability("courier-123", false);
        assertTrue(courierScheduler.getUnavailableCouriers().contains("courier-123"));

        courierScheduler.manualSetAvailability("courier-123", true);
        assertFalse(courierScheduler.getUnavailableCouriers().contains("courier-123"));
    }

    @Test
    void etaRecalculation_withNoParcels_shouldReturnZero() {
        when(parcelRepository.findByStatusIn(any())).thenReturn(List.of());

        int updated = etaScheduler.recalculateAllActiveEtas();
        assertEquals(0, updated);
    }
}
