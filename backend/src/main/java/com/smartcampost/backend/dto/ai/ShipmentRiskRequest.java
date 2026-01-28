package com.smartcampost.backend.dto.ai;

import lombok.Data;

import java.util.UUID;

@Data
public class ShipmentRiskRequest {
    private UUID parcelId;
    private String trackingRef;
}
