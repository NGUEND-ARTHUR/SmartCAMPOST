package com.smartcampost.backend.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ConfirmPaymentRequest {

    @NotNull
    private UUID paymentId;

    @NotNull
    private Boolean success;

    /**
     * Référence renvoyée par le gateway si besoin
     * (ex: transactionId MoMo / OM). Optionnel.
     */
    private String gatewayRef;
}
