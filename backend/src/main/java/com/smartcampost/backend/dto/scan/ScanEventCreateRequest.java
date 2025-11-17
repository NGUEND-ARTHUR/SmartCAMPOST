package com.smartcampost.backend.dto.scan;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ScanEventCreateRequest {

    @NotNull
    private UUID parcelId;

    private UUID agencyId;

    private UUID agentId;

    @NotNull
    private String eventType;      // ex : "CREATED", "IN_TRANSIT", "DELIVERED"

    private String locationNote;
}
