package com.smartcampost.backend.dto.tariff;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TariffRequest {

    // e.g. "STANDARD", "EXPRESS"
    private String serviceType;

    private String originZone;
    private String destinationZone;
    private String weightBracket;
    private BigDecimal price;
}
