package com.smartcampost.backend.dto.tariff;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TariffRequest {
    private String serviceType;       // "STANDARD", "EXPRESS"
    private String originZone;
    private String destinationZone;
    private String weightBracket;     // "0-1kg", "1-5kg", etc.
    private BigDecimal price;
}
