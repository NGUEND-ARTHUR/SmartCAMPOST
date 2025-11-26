package com.smartcampost.backend.dto.tariff;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class TariffResponse {

    private UUID id;

    private String serviceType;
    private String originZone;
    private String destinationZone;
    private String weightBracket;

    private BigDecimal price;
}
