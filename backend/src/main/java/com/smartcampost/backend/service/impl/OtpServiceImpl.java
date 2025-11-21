package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final Map<String, OtpRecord> otpCache = new ConcurrentHashMap<>();

    @Override
    public void generateOtp(String phone) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        Instant expires = Instant.now().plusSeconds(300); // 5 minutes
        otpCache.put(phone, new OtpRecord(otp, expires));

        System.out.println("OTP FOR " + phone + ": " + otp); // Replace with SMS API
    }

    @Override
    public boolean validateOtp(String phone, String otp) {
        OtpRecord record = otpCache.get(phone);

        if (record == null) return false;
        if (Instant.now().isAfter(record.expiresAt)) return false;

        return record.code.equals(otp);
    }

    private record OtpRecord(String code, Instant expiresAt) {}
}
