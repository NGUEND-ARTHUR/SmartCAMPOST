package com.smartcampost.backend.dto.qr;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Complete QR code data structure for parcel traceability.
 * Contains all information encoded in the permanent QR code.
 */
@Data
@Builder
public class QrCodeData {

    // ==================== PARCEL IDENTIFICATION ====================
    private UUID parcelId;
    private String trackingRef;
    private String status;
    private String serviceType;
    private String deliveryOption;
    private String paymentOption;

    // ==================== PARCEL DETAILS ====================
    private Double weight;
    private Double validatedWeight;
    private String dimensions;
    private String validatedDimensions;
    private Double declaredValue;
    private boolean fragile;
    private String photoUrl;
    private String descriptionComment;
    private String validationComment;
    private boolean descriptionConfirmed;

    // ==================== CLIENT INFO ====================
    private UUID clientId;
    private String clientName;
    private String clientPhone;
    private String clientEmail;

    // ==================== SENDER ADDRESS ====================
    private UUID senderAddressId;
    private String senderLabel;
    private String senderCity;
    private String senderRegion;
    private String senderCountry;
    private Double senderLatitude;
    private Double senderLongitude;

    // ==================== RECIPIENT ADDRESS ====================
    private UUID recipientAddressId;
    private String recipientLabel;
    private String recipientCity;
    private String recipientRegion;
    private String recipientCountry;
    private Double recipientLatitude;
    private Double recipientLongitude;

    // ==================== AGENCIES ====================
    private UUID originAgencyId;
    private String originAgencyCode;
    private String originAgencyName;
    private String originAgencyCity;

    private UUID destinationAgencyId;
    private String destinationAgencyCode;
    private String destinationAgencyName;
    private String destinationAgencyCity;

    // ==================== SCAN HISTORY ====================
    private List<ScanEventRecord> scanHistory;

    @Data
    @Builder
    public static class ScanEventRecord {
        private UUID eventId;
        private String eventType;
        private Instant timestamp;
        private String agencyName;
        private String agentName;
        private String locationNote;
    }

    // ==================== PAYMENT INFO ====================
    private List<PaymentRecord> payments;
    private Double totalPaid;
    private Double totalDue;
    private String paymentStatus;    // "PAID", "PARTIAL", "PENDING"

    @Data
    @Builder
    public static class PaymentRecord {
        private UUID paymentId;
        private Double amount;
        private String method;       // CASH, MOBILE_MONEY, CARD
        private String status;       // SUCCESS, PENDING, FAILED
        private Instant paidAt;
        private String transactionRef;
    }

    // ==================== REFUNDS ====================
    private List<RefundRecord> refunds;

    @Data
    @Builder
    public static class RefundRecord {
        private UUID refundId;
        private Double amount;
        private String reason;
        private String status;
        private Instant processedAt;
    }

    // ==================== PRICING ====================
    private PricingRecord pricing;

    @Data
    @Builder
    public static class PricingRecord {
        private Double basePrice;
        private Double weightSurcharge;
        private Double expressSurcharge;
        private Double homeDeliverySurcharge;
        private Double insuranceFee;
        private Double totalPrice;
        private String currency;
    }

    // ==================== PICKUP INFO ====================
    private PickupRecord pickup;

    @Data
    @Builder
    public static class PickupRecord {
        private UUID pickupId;
        private String state;
        private String requestedDate;
        private String timeWindow;
        private UUID courierId;
        private String courierName;
        private Instant completedAt;
    }

    // ==================== DELIVERY PROOF ====================
    private DeliveryProofRecord deliveryProof;

    @Data
    @Builder
    public static class DeliveryProofRecord {
        private UUID proofId;
        private String proofType;    // SIGNATURE, PHOTO, OTP
        private String details;
        private Instant timestamp;
        private String courierName;
    }

    // ==================== TIMESTAMPS ====================
    private Instant createdAt;
    private Instant acceptedAt;
    private Instant validatedAt;
    private String validatedBy;
    private Instant deliveredAt;
    private Instant expectedDeliveryAt;

    // ==================== QR CODE IMAGE ====================
    private String qrCodeImage;      // Base64 encoded PNG
}
