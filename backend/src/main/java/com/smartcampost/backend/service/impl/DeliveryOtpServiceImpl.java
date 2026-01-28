package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.model.DeliveryOtp;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.repository.DeliveryOtpRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.DeliveryOtpService;
import com.smartcampost.backend.service.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeliveryOtpServiceImpl implements DeliveryOtpService {

    private final DeliveryOtpRepository deliveryOtpRepository;
    private final ParcelRepository parcelRepository;
    private final NotificationService notificationService;

    private final Random random = new Random();

    @Override
    @Transactional
    public void sendDeliveryOtp(UUID parcelId, String phoneNumber) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(phoneNumber, "phoneNumber is required");
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found"));

        String code = String.format("%06d", random.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plusSeconds(10 * 60); // 10 minutes

        DeliveryOtp otp = DeliveryOtp.builder()
                .parcelId(parcel.getId())
                .phoneNumber(phoneNumber)
                .otpCode(code)
                .expiresAt(expiresAt)
                .consumed(false)
                .build();

        deliveryOtpRepository.save(otp);

        // Send SMS / notification
        notificationService.sendDeliveryOtp(phoneNumber, code, parcel.getTrackingRef());
    }

    @Override
    @Transactional
    public boolean validateDeliveryOtp(UUID parcelId, String otpCode) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(otpCode, "otpCode is required");
        DeliveryOtp otp = deliveryOtpRepository
                .findTopByParcelIdAndConsumedFalseOrderByCreatedAtDesc(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("No active OTP for parcel"));

        if (otp.isConsumed()) {
            return false;
        }

        if (Instant.now().isAfter(otp.getExpiresAt())) {
            return false;
        }

        if (!otp.getOtpCode().equals(otpCode)) {
            return false;
        }

        otp.setConsumed(true);
        deliveryOtpRepository.save(otp);
        return true;
    }
}
