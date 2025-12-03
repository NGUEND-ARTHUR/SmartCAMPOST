package com.smartcampost.backend.dto.delivery;

import lombok.Data;

@Data
public class FinalDeliveryRequest {

    private DeliveryOtpVerificationRequest otp;
    private DeliveryProofRequest proof;
}
