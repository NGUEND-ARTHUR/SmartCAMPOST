package com.smartcampost.backend.automation;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.ai.agents.TrackingPredictionAgent;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Automation G — AI-powered ETA prediction recalculation.
 * Recalculates ETA every 5 minutes for all parcels currently in transit/out for delivery.
 *
 * DUAL MODE:
 * - AUTONOMOUS: @Scheduled every 5 minutes
 * - MANUAL: call recalculateEta(parcelId) via AutomationManualController
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EtaRecalculationScheduler {

    private final ParcelRepository parcelRepository;
    private final TrackingPredictionAgent trackingPredictionAgent;

    @Scheduled(fixedDelayString = "${smartcampost.automation.eta-recalc.interval-ms:300000}")
    public void runAutonomous() {
        log.debug("[AUTOMATION-G] Running ETA recalculation (autonomous)");
        recalculateAllActiveEtas();
    }

    @Transactional
    public int recalculateAllActiveEtas() {
        List<Parcel> activeParcels = parcelRepository.findByStatusIn(
                List.of(ParcelStatus.IN_TRANSIT, ParcelStatus.OUT_FOR_DELIVERY, ParcelStatus.TAKEN_IN_CHARGE)
        );

        int updated = 0;
        for (Parcel parcel : activeParcels) {
            try {
                if (recalculateSingleEta(parcel)) updated++;
            } catch (Exception e) {
                log.warn("[AUTOMATION-G] ETA recalc failed for {}: {}", parcel.getId(), e.getMessage());
            }
        }

        log.info("[AUTOMATION-G] Recalculated ETA for {}/{} active parcels", updated, activeParcels.size());
        return updated;
    }

    private boolean recalculateSingleEta(Parcel parcel) {
        String origin = "";
        String destination = "";

        if (parcel.getSenderAddress() != null && parcel.getSenderAddress().getCity() != null) {
            origin = parcel.getSenderAddress().getCity();
        }
        if (parcel.getRecipientAddress() != null && parcel.getRecipientAddress().getCity() != null) {
            destination = parcel.getRecipientAddress().getCity();
        }

        if (origin.isBlank() || destination.isBlank()) return false;

        DeliveryPredictionRequest req = DeliveryPredictionRequest.builder()
                .originCity(origin)
                .destinationCity(destination)
                .serviceType(parcel.getServiceType() != null ? parcel.getServiceType().name() : "STANDARD")
                .build();

        DeliveryPredictionResponse prediction = trackingPredictionAgent.predict(req);
        if (prediction == null || prediction.getEstimatedDays() == null) return false;

        Instant newEta = Instant.now().plus(prediction.getEstimatedDays(), ChronoUnit.DAYS);

        if (parcel.getExpectedDeliveryAt() == null || !newEta.equals(parcel.getExpectedDeliveryAt())) {
            parcel.setExpectedDeliveryAt(newEta);
            parcelRepository.save(parcel);
            return true;
        }
        return false;
    }

    /**
     * Manual override: recalculate ETA for a specific parcel.
     */
    @Transactional
    public void manualRecalculateEta(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + parcelId));
        recalculateSingleEta(parcel);
        log.info("[AUTOMATION-G] Manually recalculated ETA for parcel {}", parcel.getTrackingRef());
    }
}
