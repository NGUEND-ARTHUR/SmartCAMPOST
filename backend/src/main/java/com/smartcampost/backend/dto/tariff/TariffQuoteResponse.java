package com.smartcampost.backend.dto.tariff;

import com.smartcampost.backend.model.enums.CurrencyCode;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TariffQuoteResponse {

    private String serviceType;        // STANDARD, EXPRESS...
    private String originZone;
    private String destinationZone;

    private BigDecimal weight;         // real weight used for pricing

    private BigDecimal basePrice;
    private BigDecimal fuelSurcharge;  // optional (can be BigDecimal.ZERO)
    private BigDecimal totalPrice;

    private CurrencyCode currency;     // XAF, EUR, etc.
    private String tariffId;           // ID of the tariff used (can be null if approximate)
}
