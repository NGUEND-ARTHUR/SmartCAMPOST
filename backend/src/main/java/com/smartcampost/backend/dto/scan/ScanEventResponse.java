package com.smartcampost.backend.dto.scan;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ScanEventResponse {

    private UUID id;
    private UUID parcelId;
    private UUID agencyId;
    private UUID agentId;
    private String eventType;
    private Instant timestamp;
    private String locationNote;
}
