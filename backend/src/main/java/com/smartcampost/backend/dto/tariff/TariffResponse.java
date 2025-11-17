package com.smartcampost.backend.dto.tariff;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TariffResponse {

    private UUID id;
    private String serviceType;      // we expose enum as String at API level
    private String originZone;
    private String destinationZone;
    private String weightBracket;
    private BigDecimal price;
}
