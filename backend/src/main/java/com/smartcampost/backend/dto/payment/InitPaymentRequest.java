package com.smartcampost.backend.dto.payment;

import com.smartcampost.backend.model.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class InitPaymentRequest {

    @NotNull
    private UUID parcelId;

    @NotNull
    private PaymentMethod method;

    private String currency;

    private String payerPhone;
}
