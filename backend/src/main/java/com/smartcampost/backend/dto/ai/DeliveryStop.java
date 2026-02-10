package com.smartcampost.backend.dto.ai;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * A stop in an optimized delivery route.
 */
@Data
@Builder
public class DeliveryStop {
    private int sequence;
    private UUID parcelId;
    private String trackingRef;
    private String recipientName;
    private String address;
    private Double latitude;
    private Double longitude;
    private String deliveryType;
    private String estimatedArrival;
}
