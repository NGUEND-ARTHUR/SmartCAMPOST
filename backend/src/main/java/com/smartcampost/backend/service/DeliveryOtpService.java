package com.smartcampost.backend.service;

import java.util.UUID;

public interface DeliveryOtpService {

    void sendDeliveryOtp(UUID parcelId, String phoneNumber);

    boolean validateDeliveryOtp(UUID parcelId, String otpCode);
}
