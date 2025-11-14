package com.smartcampost.backend.dto.scan;

import lombok.Data;

import java.util.UUID;

@Data
public class CreateScanEventRequest {

    private UUID parcelId;
    private UUID agencyId;   // nullable
    private UUID agentId;    // nullable

    private String eventType;      // e.g. "IN_TRANSIT", "ARRIVED_HUB"
    private String locationNote;   // free text: "Yaoundé Hub, Dock 3"
}
