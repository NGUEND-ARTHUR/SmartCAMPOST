package com.smartcampost.backend.ai.agents.impl;

import com.smartcampost.backend.ai.agents.RiskAgentService;
import com.smartcampost.backend.ai.events.DeliveryAttemptRecordedEvent;
import com.smartcampost.backend.ai.events.ScanEventRecordedEvent;
import com.smartcampost.backend.dto.analytics.EtaPredictionResponse;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.RiskAlert;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.RiskAlertStatus;
import com.smartcampost.backend.model.enums.RiskAlertType;
import com.smartcampost.backend.model.enums.RiskSeverity;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.repository.DeliveryAttemptRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.RiskAlertRepository;
import com.smartcampost.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class RiskAgentServiceImpl implements RiskAgentService {

    private static final EnumSet<ParcelStatus> FINAL_STATUSES = EnumSet.of(
            ParcelStatus.DELIVERED,
            ParcelStatus.PICKED_UP_AT_AGENCY,
            ParcelStatus.RETURNED,
            ParcelStatus.RETURNED_TO_SENDER,
            ParcelStatus.CANCELLED
    );

    private final ParcelRepository parcelRepository;
    private final RiskAlertRepository riskAlertRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final AnalyticsService analyticsService;

    @Override
    public void onScanEventRecorded(ScanEventRecordedEvent event) {
        Objects.requireNonNull(event, "event is required");

        // Operational scan events that warrant immediate risk evaluation
        if (event.eventType() == ScanEventType.DELIVERY_FAILED) {
            evaluateRepeatedDeliveryFailures(event.parcelId());
        }

        // Always evaluate delay risk when a scan event is recorded
        evaluateDelayRisk(event.parcelId());
    }

    @Override
    public void onDeliveryAttemptRecorded(DeliveryAttemptRecordedEvent event) {
        Objects.requireNonNull(event, "event is required");

        if (event.result() != null && "SUCCESS".equalsIgnoreCase(event.result().name())) {
            return;
        }

        evaluateRepeatedDeliveryFailures(event.parcelId());
        evaluateDelayRisk(event.parcelId());
    }

    private void evaluateDelayRisk(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");

        Optional<Parcel> parcelOpt = parcelRepository.findById(id);
        if (parcelOpt.isEmpty()) return;

        Parcel parcel = parcelOpt.get();
        if (parcel.getStatus() != null && FINAL_STATUSES.contains(parcel.getStatus())) {
            return;
        }

        EtaPredictionResponse eta;
        try {
            eta = analyticsService.predictEtaForParcel(id);
        } catch (Exception ex) {
            log.debug("RiskAgent: ETA prediction failed for parcel {}: {}", id, ex.getMessage());
            return;
        }

        Instant predicted = eta != null ? eta.getPredictedDeliveryAt() : null;
        if (predicted == null) return;

        Instant now = Instant.now();
        if (!predicted.isBefore(now)) return;

        long overdueHours = Duration.between(predicted, now).toHours();
        RiskSeverity severity = overdueHours >= 72
                ? RiskSeverity.CRITICAL
                : (overdueHours >= 24 ? RiskSeverity.HIGH : RiskSeverity.MEDIUM);

        String description = "Predicted delivery ETA has passed (overdue by ~" + overdueHours + "h).";
        upsertParcelRiskAlert(id, RiskAlertType.DELIVERY_DELAY, severity, description);
    }

    private void evaluateRepeatedDeliveryFailures(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");

        Optional<Parcel> parcelOpt = parcelRepository.findById(id);
        if (parcelOpt.isEmpty()) return;

        Parcel parcel = parcelOpt.get();
        if (parcel.getStatus() != null && FINAL_STATUSES.contains(parcel.getStatus())) {
            return;
        }

        int failedAttempts;
        try {
            failedAttempts = deliveryAttemptRepository.countFailedAttempts(id);
        } catch (Exception ex) {
            failedAttempts = 0;
        }

        if (failedAttempts < 2) return;

        RiskSeverity severity = failedAttempts >= 4
                ? RiskSeverity.CRITICAL
                : (failedAttempts >= 3 ? RiskSeverity.HIGH : RiskSeverity.MEDIUM);

        String description = "Repeated failed delivery attempts detected (failedAttempts=" + failedAttempts + ").";
        upsertParcelRiskAlert(id, RiskAlertType.REPEATED_DELIVERY_FAILURE, severity, description);
    }

    private void upsertParcelRiskAlert(UUID parcelId, RiskAlertType type, RiskSeverity severity, String description) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(type, "type is required");
        Objects.requireNonNull(severity, "severity is required");

        Optional<RiskAlert> existing = riskAlertRepository
                .findTopByParcel_IdAndAlertTypeAndResolvedFalseOrderByCreatedAtDesc(parcelId, type);

        if (existing.isPresent()) {
            RiskAlert alert = existing.get();
            alert.setSeverity(severity);
            alert.setDescription(description);
            alert.setStatus(RiskAlertStatus.OPEN);
            riskAlertRepository.save(alert);
            return;
        }

        Parcel parcel = parcelRepository.findById(parcelId).orElse(null);
        if (parcel == null) return;

        RiskAlert alert = RiskAlert.builder()
                .parcel(parcel)
                .alertType(type)
                .severity(severity)
                .status(RiskAlertStatus.OPEN)
                .resolved(false)
                .description(description)
                .build();
        riskAlertRepository.save(alert);
    }
}
