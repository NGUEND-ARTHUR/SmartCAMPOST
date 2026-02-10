package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.OtpException;
import com.smartcampost.backend.model.OtpCode;
import com.smartcampost.backend.model.enums.OtpPurpose;
import com.smartcampost.backend.repository.OtpCodeRepository;
import com.smartcampost.backend.service.NotificationGatewayService;
import com.smartcampost.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final NotificationGatewayService gatewayService;

    private static final int OTP_LENGTH = 6;
    private static final long TTL_MINUTES = 5;        // validité 5 minutes
    private static final long COOLDOWN_SECONDS = 60;  // max 1 OTP / 1 minute

    private final SecureRandom random = new SecureRandom();

    @Override
    public String generateOtp(String phone, OtpPurpose purpose) {
        Objects.requireNonNull(phone, "phone is required");
        Objects.requireNonNull(purpose, "purpose is required");
        Instant now = Instant.now();

        // 1) Cooldown par téléphone + purpose (REGISTER, RESET_PASSWORD, LOGIN)
        otpCodeRepository.findTopByPhoneAndPurposeOrderByCreatedAtDesc(phone, purpose)
                .ifPresent(last -> {
                    Instant limit = now.minusSeconds(COOLDOWN_SECONDS);
                    if (last.getCreatedAt().isAfter(limit)) {
                        // Trop de requêtes OTP dans un court délai
                        throw new OtpException(
                                ErrorCode.OTP_TOO_MANY_REQUESTS,
                                "Please wait before requesting a new OTP."
                        );
                    }
                });

        // 2) Générer le code
        String code = generateRandomOtp(OTP_LENGTH);

        // 3) Calculer la date d’expiration (sans ChronoUnit)
        Instant expiresAt = now.plusSeconds(TTL_MINUTES * 60);

        // 4) Sauvegarder en base
        OtpCode otp = OtpCode.builder()
                .phone(phone)
                .code(code)
                .purpose(purpose)
                .expiresAt(expiresAt)
                .used(false)
                .build();

        @SuppressWarnings({"null", "unused"})
        OtpCode saved = otpCodeRepository.save(otp);

        // 5) Envoyer via le gateway (Twilio en prod, mock en dev si configuré)
        try {
            String message = buildOtpMessage(purpose, code);
            gatewayService.sendSms(phone, message);
            log.info("OTP generated and sent for {} [{}]", maskPhone(phone), purpose);
        } catch (Exception ex) {
            // If we couldn't send, delete the generated OTP so user can retry immediately.
            otpCodeRepository.delete(saved);
            throw new OtpException(
                    ErrorCode.NOTIFICATION_SEND_FAILED,
                    "Failed to send OTP. Please try again."
            );
        }
        return code;
    }

    @Override
    public boolean validateOtp(String phone, String otp, OtpPurpose purpose) {
        Objects.requireNonNull(phone, "phone is required");
        Objects.requireNonNull(otp, "otp is required");
        Objects.requireNonNull(purpose, "purpose is required");
        Instant now = Instant.now();
        return otpCodeRepository
                .findTopByPhoneAndPurposeAndUsedIsFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        phone, purpose, now
                )
                .map(record -> record.getCode().equals(otp))
                .orElse(false);
    }

    @Override
    public void consumeOtp(String phone, String otp, OtpPurpose purpose) {
        Objects.requireNonNull(phone, "phone is required");
        Objects.requireNonNull(otp, "otp is required");
        Objects.requireNonNull(purpose, "purpose is required");
        Instant now = Instant.now();
        otpCodeRepository
                .findTopByPhoneAndPurposeAndUsedIsFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        phone, purpose, now
                )
                .filter(record -> record.getCode().equals(otp))
                .ifPresent(record -> {
                    record.setUsed(true);
                    Objects.requireNonNull(otpCodeRepository.save(record), "failed to save otp code");
                });
    }

    private String generateRandomOtp(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10)); // digits 0–9
        }
        return sb.toString();
    }

    private String buildOtpMessage(OtpPurpose purpose, String code) {
        String label = switch (purpose) {
            case REGISTER -> "registration";
            case LOGIN -> "login";
            case RESET_PASSWORD -> "password reset";
        };
        return "SmartCAMPOST " + label + " code: " + code + ". Valid for " + TTL_MINUTES + " minutes.";
    }

    private String maskPhone(String phone) {
        if (phone == null) return "";
        String trimmed = phone.trim();
        if (trimmed.length() <= 4) return "****";
        return "****" + trimmed.substring(trimmed.length() - 4);
    }
}
