package com.smartcampost.backend.dto.finance;

import com.smartcampost.backend.model.enums.RefundStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateRefundStatusRequest {
    @NotNull
    private RefundStatus status; // REQUESTED, APPROVED, REJECTED, PROCESSED
}