package com.smartcampost.backend.dto.pricing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingDetailResponse {

    private UUID id;

    private UUID parcelId;
    private UUID tariffId;

    private String serviceType;
    private String originZone;
    private String destinationZone;
    private String weightBracket;

    private Double appliedPrice;
    private Instant appliedAt;
}
