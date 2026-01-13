package com.smartcampost.backend.dto.qr;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Printable QR label data with CAMPOST branding.
 * Contains all information needed to print a physical label.
 */
@Data
@Builder
public class QrLabelData {

    // Identification
    private UUID parcelId;
    private String trackingRef;
    private String barcode;          // EAN-13 or Code128 format

    // QR code (contains full tracking URL)
    private String qrCodeImage;      // Base64 PNG
    private String qrContent;        // Raw data in QR

    // CAMPOST branding
    private String companyName;      // "CAMPOST"
    private String companyLogo;      // Base64 logo image
    private String labelTitle;       // "COLIS EXPRESS" / "COLIS STANDARD"

    // Sender info (abbreviated for label)
    private String senderName;
    private String senderCity;
    private String senderPhone;

    // Recipient info
    private String recipientName;
    private String recipientCity;
    private String recipientPhone;
    private String recipientAddress; // Short version

    // Service info
    private String serviceType;      // "EXPRESS" / "STANDARD"
    private String deliveryOption;   // "AGENCY" / "HOME"
    private boolean fragile;
    private Double weight;

    // Agency routing
    private String originAgencyCode;
    private String originAgencyName;
    private String destinationAgencyCode;
    private String destinationAgencyName;

    // Pricing (if prepaid, show on label)
    private Double totalAmount;
    private String paymentStatus;    // "PAID" / "COD"
    private String currency;         // "XAF"

    // Timestamps
    private Instant printedAt;
    private String printedBy;        // Agent name

    // Label format hints
    private String labelSize;        // "100x50mm", "100x150mm"
    private int copiesCount;         // How many copies to print
}
