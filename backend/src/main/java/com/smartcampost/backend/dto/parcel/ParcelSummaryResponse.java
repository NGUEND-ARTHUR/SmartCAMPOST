package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.ParcelStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParcelSummaryResponse {

    private UUID id;
    private String trackingRef;
    private ParcelStatus status;
    private String serviceType;
    private Instant createdAt;
}
