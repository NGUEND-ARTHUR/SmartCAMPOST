package com.smartcampost.backend.dto.delivery;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for delivery receipts.
 */
@Data
@Builder
public class DeliveryReceiptResponse {

    private UUID receiptId;
    private String receiptNumber;
    
    // Parcel info
    private UUID parcelId;
    private String trackingRef;
    
    // Delivery info
    private String receiverName;
    private String deliveryAddress;
    private Instant deliveredAt;
    
    // Courier info
    private String courierName;
    
    // Payment info
    private Double totalAmount;
    private boolean paymentCollected;
    private String paymentMethod;
    
    // Receipt metadata
    private String pdfUrl;
    private Instant generatedAt;
    
    // Proof reference
    private UUID proofId;
    private String proofType;
}
