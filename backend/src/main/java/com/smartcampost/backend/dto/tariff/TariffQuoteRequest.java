package com.smartcampost.backend.dto.tariff;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TariffQuoteRequest {
    private String serviceType;
    private String originZone;
    private String destinationZone;
    private BigDecimal weight;
}
