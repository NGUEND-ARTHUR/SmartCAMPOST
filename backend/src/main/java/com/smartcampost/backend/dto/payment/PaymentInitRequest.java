package com.smartcampost.backend.dto.payment;

import com.smartcampost.backend.model.enums.CurrencyCode;
import com.smartcampost.backend.model.enums.PaymentMethod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInitRequest {

    @NotNull
    private UUID parcelId;

    @NotNull
    @Min(1)
    private BigDecimal amount;

    @NotNull
    private CurrencyCode currency;

    @NotNull
    private PaymentMethod method;
}
