package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.delivery.DeliveryReceiptResponse;
import com.smartcampost.backend.model.DeliveryProof;
import com.smartcampost.backend.model.Parcel;

import java.util.Optional;
import java.util.UUID;

/**
 * Service for generating and managing delivery receipts.
 */
public interface DeliveryReceiptService {

    /**
     * Generate a delivery receipt for a completed delivery.
     * 
     * @param parcel The delivered parcel
     * @param proof The delivery proof
     * @param receiverName Name of the person who received the parcel
     * @param paymentCollected Whether payment was collected on delivery
     * @param amountCollected Amount collected (for COD)
     * @param paymentMethod Payment method used
     * @return The generated receipt response
     */
    DeliveryReceiptResponse generateReceipt(
            Parcel parcel,
            DeliveryProof proof,
            String receiverName,
            boolean paymentCollected,
            Double amountCollected,
            String paymentMethod
    );

    /**
     * Get receipt by parcel ID.
     * 
     * @param parcelId The parcel ID
     * @return Optional containing the receipt if found
     */
    Optional<DeliveryReceiptResponse> getReceiptByParcelId(UUID parcelId);

    /**
     * Get receipt by receipt number.
     * 
     * @param receiptNumber The receipt number
     * @return Optional containing the receipt if found
     */
    Optional<DeliveryReceiptResponse> getReceiptByNumber(String receiptNumber);

    /**
     * Check if a receipt has been generated for a parcel.
     * 
     * @param parcelId The parcel ID
     * @return true if a receipt exists
     */
    boolean hasReceipt(UUID parcelId);
}
