package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.analytics.AnomalyCheckResponse;
import com.smartcampost.backend.dto.analytics.EtaPredictionResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ParcelRepository parcelRepository;
    private final PaymentRepository paymentRepository;
    private final ScanEventRepository scanEventRepository;

    // ================== ETA PREDICTION ==================
    @Override
    public EtaPredictionResponse predictEtaForParcel(UUID parcelId) {

        Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        Instant predicted;
        double confidence;

        ScanEvent lastEvent = null;
        ScanEventType lastType = null;
        Instant lastTs = null;
        String lastLocationNote = null;
        int scanCount = 0;

        try {
            lastEvent = scanEventRepository.findTopByParcel_IdOrderByTimestampDesc(parcelId).orElse(null);
            if (lastEvent != null) {
                lastType = lastEvent.getEventType();
                lastTs = lastEvent.getTimestamp();
                lastLocationNote = lastEvent.getLocationNote();
            }
            scanCount = scanEventRepository.findByParcel_IdOrderByTimestampAsc(parcelId).size();
        } catch (Exception ignored) {
            lastEvent = null;
            lastType = null;
            lastTs = null;
            lastLocationNote = null;
            scanCount = 0;
        }

        try {
            if (parcel.getExpectedDeliveryAt() != null) {
                predicted = parcel.getExpectedDeliveryAt();
                confidence = 0.9;
            } else {
                // ScanEvent-based ETA: anchor on last ScanEvent when available
                Instant anchor = (lastTs != null ? lastTs : parcel.getCreatedAt());
                ScanEventType t = lastType;

                long seconds;
                double base;
                if (t == null) {
                    seconds = 3L * 24 * 3600;
                    base = 0.55;
                } else {
                    switch (t) {
                        case OUT_FOR_DELIVERY -> {
                            seconds = 4L * 3600;
                            base = 0.85;
                        }
                        case ARRIVED_DESTINATION, ARRIVED_DEST_AGENCY -> {
                            seconds = 12L * 3600;
                            base = 0.8;
                        }
                        case IN_TRANSIT, DEPARTED_HUB, ARRIVED_HUB -> {
                            seconds = 24L * 3600;
                            base = 0.7;
                        }
                        case TAKEN_IN_CHARGE -> {
                            seconds = 2L * 24 * 3600;
                            base = 0.65;
                        }
                        case DELIVERY_FAILED, RESCHEDULED -> {
                            seconds = 24L * 3600;
                            base = 0.6;
                        }
                        case DELIVERED, PICKED_UP_AT_AGENCY, RETURNED, RETURNED_TO_SENDER, CANCELLED -> {
                            seconds = 0;
                            base = 0.98;
                        }
                        default -> {
                            seconds = 3L * 24 * 3600;
                            base = 0.6;
                        }
                    }
                }

                predicted = anchor.plusSeconds(seconds);

                confidence = base;
                if (scanCount >= 3) confidence += 0.05;
                if (scanCount >= 8) confidence += 0.05;
                if (lastTs != null) {
                    long ageSeconds = Math.max(0L, Instant.now().getEpochSecond() - lastTs.getEpochSecond());
                    if (ageSeconds > 7L * 24 * 3600) confidence -= 0.15;
                }
                if (confidence < 0.1) confidence = 0.1;
                if (confidence > 0.99) confidence = 0.99;
            }
        } catch (Exception ex) {
            // 🔥 Use ETA_CALCULATION_FAILED
            throw new ConflictException(
                    "Could not compute ETA for parcel",
                    ErrorCode.ETA_CALCULATION_FAILED
            );
        }

        return EtaPredictionResponse.builder()
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .predictedDeliveryAt(predicted)
                .confidence(confidence)
                .lastEventType(lastType != null ? lastType.name() : null)
                .lastEventAt(lastTs)
                .lastLocationNote(lastLocationNote)
                .build();
    }

    // ================== PAYMENT ANOMALY ==================
    @Override
    public AnomalyCheckResponse checkPaymentAnomaly(UUID paymentId) {

        Objects.requireNonNull(paymentId, "paymentId is required");
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found",
                        ErrorCode.PAYMENT_NOT_FOUND
                ));

        double amount = payment.getAmount();
        boolean anomalous = false;
        String reason = "Normal payment";
        double score = 0.1;

        try {
            // Simple rule: amount above threshold = suspicious
            if (amount > 200000) {
                anomalous = true;
                reason = "Amount exceeds anomaly threshold";
                score = 0.8;
            }
        } catch (Exception ex) {
            // 🔥 Use ANOMALY_DETECTION_FAILED
            throw new ConflictException(
                    "Failed to evaluate payment anomaly",
                    ErrorCode.ANOMALY_DETECTION_FAILED
            );
        }

        return AnomalyCheckResponse.builder()
                .anomalous(anomalous)
                .reason(reason)
                .score(score)
                .build();
    }
}
