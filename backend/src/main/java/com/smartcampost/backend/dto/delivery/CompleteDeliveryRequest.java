package com.smartcampost.backend.dto.delivery;

import com.smartcampost.backend.model.enums.DeliveryProofType;
import lombok.Data;

import java.util.UUID;

/**
 * Request to complete delivery with full verification.
 */
@Data
public class CompleteDeliveryRequest {

    private UUID parcelId;
    private String trackingRef;     // Alternative: use tracking ref

    // ==================== OTP VERIFICATION ====================
    private String otpCode;         // Required for home delivery

    // ==================== PROOF OF DELIVERY ====================
    private DeliveryProofType proofType;  // SIGNATURE, PHOTO, OTP

    // Photo proof (Base64 encoded)
    private String photoBase64;
    private String photoUrl;

    // Signature proof (Base64 encoded signature data)
    private String signatureBase64;

    // Receiver information
    private String receiverName;     // Person who received (if different from recipient)
    private String receiverIdNumber; // Optional: ID card number
    private String receiverRelation; // e.g., "Spouse", "Colleague"

    // ==================== LOCATION ====================
    private Double latitude;
    private Double longitude;
    private Double accuracy;         // GPS accuracy in meters

    // ==================== PAYMENT (if COD) ====================
    private boolean paymentCollected;
    private Double amountCollected;
    private String paymentMethod;    // CASH, MOBILE_MONEY

    // ==================== NOTES ====================
    private String notes;
}
