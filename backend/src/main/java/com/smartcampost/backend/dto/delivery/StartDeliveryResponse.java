package com.smartcampost.backend.dto.delivery;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Response after starting delivery.
 */
@Data
@Builder
public class StartDeliveryResponse {

    private UUID parcelId;
    private String trackingRef;
    private String status;           // Should be OUT_FOR_DELIVERY

    // Recipient information for delivery
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private Double recipientLatitude;
    private Double recipientLongitude;

    // Courier assigned
    private UUID courierId;
    private String courierName;

    // OTP status
    private boolean otpSent;
    private String otpSentTo;        // Phone number (masked)

    // Timestamps
    private Instant startedAt;
    private Instant expectedDeliveryAt;

    // Notification sent to recipient
    private boolean recipientNotified;
}
