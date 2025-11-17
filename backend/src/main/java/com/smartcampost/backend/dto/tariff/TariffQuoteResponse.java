package com.smartcampost.backend.dto.tariff;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TariffQuoteResponse {

    private UUID tariffId;
    private BigDecimal price;
}
