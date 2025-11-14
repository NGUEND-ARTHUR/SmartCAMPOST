package com.smartcampost.backend.dto.payment;

import com.smartcampost.backend.model.enums.CurrencyCode;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreatePaymentRequest {

    private UUID parcelId;
    private BigDecimal amount;
    private CurrencyCode currency;
    private String method;        // "Digital" or "Cash" (or use enum if you created one)
}
