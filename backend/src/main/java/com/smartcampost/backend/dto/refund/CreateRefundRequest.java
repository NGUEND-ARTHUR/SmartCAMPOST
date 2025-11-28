package com.smartcampost.backend.dto.refund;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateRefundRequest {

    @NotNull
    private UUID paymentId;

    @NotNull
    @Positive
    private Double amount;

    private String reason;
}
