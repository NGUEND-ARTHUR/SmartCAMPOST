package com.smartcampost.backend.dto.refund;
import com.smartcampost.backend.model.enums.RefundStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RefundResponse {

    private UUID id;
    private UUID paymentId;
    private UUID parcelId;
    private String parcelTrackingRef;
    private Double amount;
    private String currency;
    private RefundStatus status;
    private String reason;
    private Instant createdAt;
    private Instant processedAt;
}