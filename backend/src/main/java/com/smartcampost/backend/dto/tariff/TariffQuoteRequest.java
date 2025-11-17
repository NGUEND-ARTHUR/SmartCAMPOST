package com.smartcampost.backend.dto.tariff;

import lombok.Data;

import java.util.UUID;

@Data
public class TariffQuoteRequest {

    private String serviceType;      // String, mapped to enum in service
    private String originZone;
    private String destinationZone;
    private String weightBracket;

    // optional: if present, we log PricingDetail
    private UUID parcelId;
}
