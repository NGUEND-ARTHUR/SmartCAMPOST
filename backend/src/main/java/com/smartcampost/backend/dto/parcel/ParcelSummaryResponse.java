package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.ParcelStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ParcelSummaryResponse {
    private UUID parcelId;
    private String trackingRef;
    private ParcelStatus status;
    private String lastEventType;
    private Instant lastEventTime;
}
