package com.smartcampost.backend.dto.delivery;

import lombok.Data;

import java.util.UUID;

/**
 * Request to start delivery - courier marks parcel as OUT_FOR_DELIVERY.
 */
@Data
public class StartDeliveryRequest {

    private UUID parcelId;
    private String trackingRef;     // Alternative: use tracking ref

    // Courier/agent information
    private UUID courierId;

    // GPS location when starting delivery
    private Double latitude;
    private Double longitude;

    // Notes
    private String notes;
}
