package com.smartcampost.backend.dto.pickup;

import com.smartcampost.backend.dto.qr.QrCodeData;
import com.smartcampost.backend.dto.qr.QrLabelData;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO after pickup confirmation.
 * Contains the permanent QR code and label data for printing.
 */
@Data
@Builder
public class ConfirmPickupResponse {

    private UUID pickupId;
    private String pickupState;          // Should be COMPLETED

    private UUID parcelId;
    private String trackingRef;          // Permanent tracking reference
    private String parcelStatus;         // Should be ACCEPTED

    // Agent who confirmed the pickup
    private UUID agentId;
    private String agentName;

    // Validation details
    private Double validatedWeight;
    private String validatedDimensions;
    private String validationComment;
    private boolean descriptionConfirmed;
    private Instant validatedAt;

    // Location of pickup
    private Double latitude;
    private Double longitude;

    // Permanent QR code data
    private QrCodeData qrCodeData;

    // Printable label (if requested)
    private QrLabelData labelData;

    // Notification sent to client
    private boolean clientNotified;
    private String notificationMessage;

    // Timestamps
    private Instant confirmedAt;
}
