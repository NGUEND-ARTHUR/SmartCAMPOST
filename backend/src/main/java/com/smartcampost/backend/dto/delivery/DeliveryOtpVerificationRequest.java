package com.smartcampost.backend.dto.delivery;

import lombok.Data;

import java.util.UUID;

@Data
public class DeliveryOtpVerificationRequest {
    private UUID parcelId;
    private String otpCode;
}
