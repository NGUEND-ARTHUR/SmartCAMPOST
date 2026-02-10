package com.smartcampost.backend.dto.delivery;

import lombok.Data;

import java.util.UUID;

/**
 * Request for recipient pickup at destination agency: QR + OTP + GPS.
 */
@Data
public class PickupAtAgencyRequest {
    private UUID parcelId;
    private String trackingRef;
    private String otpCode;

    // GPS is mandatory
    private Double latitude;
    private Double longitude;

    private String notes;
}
