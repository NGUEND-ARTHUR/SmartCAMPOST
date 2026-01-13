package com.smartcampost.backend.dto.delivery;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Response after completing delivery.
 */
@Data
@Builder
public class CompleteDeliveryResponse {

    private UUID parcelId;
    private String trackingRef;
    private String status;           // Should be DELIVERED

    // Delivery proof
    private UUID proofId;
    private String proofType;
    private String proofDetails;
    private Instant proofTimestamp;

    // Receiver info
    private String receiverName;
    private Double latitude;
    private Double longitude;

    // Payment info (if COD)
    private boolean paymentCollected;
    private Double amountCollected;
    private UUID paymentId;

    // Courier who delivered
    private UUID courierId;
    private String courierName;

    // Notifications
    private boolean clientNotified;
    private boolean receiptGenerated;
    private String receiptUrl;

    // Timestamps
    private Instant deliveredAt;
}
