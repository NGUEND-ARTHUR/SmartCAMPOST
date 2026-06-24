package com.smartcampost.backend.service;

import java.util.UUID;

public interface DeliveryOtpService {

    void sendDeliveryOtp(UUID parcelId, String phoneNumber);

    /** Checks the code without consuming it — used for an early "is this correct?" UX check. */
    boolean checkDeliveryOtp(UUID parcelId, String otpCode);

    /** Validates the code and consumes it — must only be called by the action that actually finalizes the delivery. */
    boolean validateDeliveryOtp(UUID parcelId, String otpCode);
}
