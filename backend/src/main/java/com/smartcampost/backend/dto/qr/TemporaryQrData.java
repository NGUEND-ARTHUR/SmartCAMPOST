package com.smartcampost.backend.dto.qr;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Temporary QR code data for pickup requests.
 * Used before agent arrives to confirm pickup.
 */
@Data
@Builder
public class TemporaryQrData {

    // Pickup information
    private UUID pickupId;
    private String temporaryToken;   // Secure token for validation
    private Instant expiresAt;       // QR validity period
    private boolean isValid;

    // Pre-registered parcel info
    private UUID parcelId;
    private String preTrackingRef;   // Temporary tracking (e.g., "TMP-2026-XXXX")

    // Parcel description (client-provided)
    private String contentType;
    private Double estimatedWeight;
    private String dimensions;
    private Double declaredValue;
    private boolean fragile;
    private String photoUrl;
    private String descriptionComment;

    // Client information
    private UUID clientId;
    private String clientName;
    private String clientPhone;

    // Pickup address
    private UUID addressId;
    private String pickupAddressLabel;
    private String city;
    private String region;
    private Double latitude;
    private Double longitude;

    // Pickup scheduling
    private LocalDate requestedDate;
    private String timeWindow;

    // Destination info
    private UUID destinationAgencyId;
    private String destinationAgencyName;
    private String recipientName;
    private String recipientPhone;

    // QR code image (Base64)
    private String qrCodeImage;

    // Timestamps
    private Instant createdAt;
    private Instant scannedAt;      // When agent scanned
    private UUID scannedByAgentId;
}
