package com.smartcampost.backend.dto.payment;

import com.smartcampost.backend.model.enums.PaymentMethod;
import com.smartcampost.backend.model.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private UUID id;

    private UUID parcelId;
    private String parcelTrackingRef;

    private Double amount;
    private String currency;

    private PaymentMethod method;
    private PaymentStatus status;

    private Instant timestamp;

    private String externalRef;
}
