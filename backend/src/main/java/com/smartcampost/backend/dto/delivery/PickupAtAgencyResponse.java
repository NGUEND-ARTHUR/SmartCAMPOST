package com.smartcampost.backend.dto.delivery;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PickupAtAgencyResponse {
    private UUID parcelId;
    private String trackingRef;
    private String status;
    private boolean otpVerified;
    private Double latitude;
    private Double longitude;
    private Instant pickedUpAt;
}
