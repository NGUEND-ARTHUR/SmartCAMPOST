package com.smartcampost.backend.dto.invoice;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class InvoiceResponse {
    private UUID id;
    private UUID paymentId;
    private UUID parcelId;
    private String parcelTrackingRef;
    private String invoiceNumber;
    private Double totalAmount;
    private Instant issuedAt;
    private String pdfLink;
}
