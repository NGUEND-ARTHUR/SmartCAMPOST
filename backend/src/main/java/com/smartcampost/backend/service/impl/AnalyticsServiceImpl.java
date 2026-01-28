package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.analytics.AnomalyCheckResponse;
import com.smartcampost.backend.dto.analytics.EtaPredictionResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PaymentRepository;
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

        try {
            if (parcel.getExpectedDeliveryAt() != null) {
                predicted = parcel.getExpectedDeliveryAt();
                confidence = 0.9;
            } else {
                long threeDaysInSeconds = 3L * 24 * 3600;
                predicted = parcel.getCreatedAt().plusSeconds(threeDaysInSeconds);
                confidence = 0.6;
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
