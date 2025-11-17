package com.smartcampost.backend.dto.payment;

import com.smartcampost.backend.model.enums.CurrencyCode;
import com.smartcampost.backend.model.enums.PaymentMethod;
import com.smartcampost.backend.model.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {

    private UUID id;
    private UUID parcelId;
    private BigDecimal amount;
    private CurrencyCode currency;
    private PaymentMethod method;
    private PaymentStatus status;
    private Instant timestamp;
    private String externalRef;
}
