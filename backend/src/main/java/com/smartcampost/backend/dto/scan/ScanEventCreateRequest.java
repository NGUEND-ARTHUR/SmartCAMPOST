package com.smartcampost.backend.dto.scan;

import lombok.Data;

import java.util.UUID;

@Data
public class ScanEventCreateRequest {

    private UUID parcelId;
    private UUID agencyId;      // optional
    private UUID agentId;       // optional

    private String eventType;   // "CREATED", "IN_TRANSIT", "ARRIVED_HUB", ...
    private String locationNote; // "Yaoundé Hub, Dock 3", GPS note, etc.
}
