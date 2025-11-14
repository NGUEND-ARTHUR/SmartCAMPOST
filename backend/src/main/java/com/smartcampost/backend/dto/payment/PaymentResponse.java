package com.smartcampost.backend.dto.payment;

import com.smartcampost.backend.model.enums.CurrencyCode;
import com.smartcampost.backend.model.enums.PaymentMethod;
import com.smartcampost.backend.model.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private UUID paymentId;
    private UUID parcelId;

    private BigDecimal amount;
    private CurrencyCode currency;
    private PaymentMethod method;

    private PaymentStatus status;
    private String externalRef;
    private Instant timestamp;
}
