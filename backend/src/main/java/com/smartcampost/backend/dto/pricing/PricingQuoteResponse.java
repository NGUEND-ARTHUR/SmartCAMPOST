package com.smartcampost.backend.dto.pricing;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class PricingQuoteResponse {
    private UUID parcelId;
    private BigDecimal amount;
    private String currency;
}
