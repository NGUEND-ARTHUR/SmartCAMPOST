package com.smartcampost.backend.dto.delivery;

import lombok.Data;

@Data
public class FinalDeliveryRequest {

    private DeliveryOtpVerificationRequest otp;
    private DeliveryProofRequest proof;

    // GPS is mandatory for status transition to DELIVERED
    private Double latitude;
    private Double longitude;
    private String notes;
}
