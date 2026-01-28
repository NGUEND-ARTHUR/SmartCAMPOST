package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.delivery.DeliveryReceiptResponse;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.repository.DeliveryReceiptRepository;
import com.smartcampost.backend.service.DeliveryReceiptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of the DeliveryReceiptService.
 * Handles generation and retrieval of delivery receipts.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryReceiptServiceImpl implements DeliveryReceiptService {

    private final DeliveryReceiptRepository receiptRepository;

    private static final String RECEIPT_PREFIX = "REC";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Override
    @Transactional
    public DeliveryReceiptResponse generateReceipt(
            Parcel parcel,
            DeliveryProof proof,
            String receiverName,
            boolean paymentCollected,
            Double amountCollected,
            String paymentMethod) {

        Objects.requireNonNull(parcel, "parcel is required");

        // Check if receipt already exists
        if (receiptRepository.existsByParcel_Id(parcel.getId())) {
            log.info("Receipt already exists for parcel {}", parcel.getTrackingRef());
            return getReceiptByParcelId(parcel.getId()).orElse(null);
        }

        // Generate receipt number
        String receiptNumber = generateReceiptNumber(parcel);

        // Build delivery address string
        String deliveryAddress = formatDeliveryAddress(parcel);

        // Get courier name from proof
        String courierName = null;
        if (proof != null && proof.getCourier() != null) {
            courierName = proof.getCourier().getFullName();
        }

        // Get delivery timestamp
        Instant deliveredAt = proof != null ? proof.getTimestamp() : Instant.now();

        // Create receipt entity
        DeliveryReceipt receipt = DeliveryReceipt.builder()
                .parcel(parcel)
                .proof(proof)
                .receiptNumber(receiptNumber)
                .receiverName(receiverName)
                .deliveryAddress(deliveryAddress)
                .courierName(courierName)
                .totalAmount(amountCollected)
                .paymentCollected(paymentCollected)
                .paymentMethod(paymentMethod)
                .deliveredAt(deliveredAt)
                .generatedAt(Instant.now())
                .build();

        // Save the receipt
        receipt = receiptRepository.save(receipt);
        log.info("Generated delivery receipt {} for parcel {}", receiptNumber, parcel.getTrackingRef());

        return mapToResponse(receipt, parcel, proof);
    }

    @Override
    public Optional<DeliveryReceiptResponse> getReceiptByParcelId(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        return receiptRepository.findByParcel_Id(parcelId)
                .map(receipt -> mapToResponse(receipt, receipt.getParcel(), receipt.getProof()));
    }

    @Override
    public Optional<DeliveryReceiptResponse> getReceiptByNumber(String receiptNumber) {
        return receiptRepository.findByReceiptNumber(receiptNumber)
                .map(receipt -> mapToResponse(receipt, receipt.getParcel(), receipt.getProof()));
    }

    @Override
    public boolean hasReceipt(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        return receiptRepository.existsByParcel_Id(parcelId);
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Generate a unique receipt number.
     * Format: REC-YYYYMMDD-XXXXX where XXXXX is derived from parcel ID
     */
    private String generateReceiptNumber(Parcel parcel) {
        String datePart = LocalDateTime.now(ZoneId.of("Africa/Douala"))
                .format(DATE_FORMAT);
        String idPart = parcel.getId().toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();
        return String.format("%s-%s-%s", RECEIPT_PREFIX, datePart, idPart);
    }

    /**
     * Format the delivery address for the receipt.
     */
    private String formatDeliveryAddress(Parcel parcel) {
        Address recipient = parcel.getRecipientAddress();
        if (recipient == null) {
            Agency destAgency = parcel.getDestinationAgency();
            if (destAgency != null) {
                return "Agency pickup: " + destAgency.getAgencyName();
            }
            return "Address not available";
        }

        StringBuilder sb = new StringBuilder();
        if (recipient.getLabel() != null) {
            sb.append(recipient.getLabel());
        }
        if (recipient.getCity() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(recipient.getCity());
        }
        if (recipient.getRegion() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(recipient.getRegion());
        }
        return sb.toString();
    }

    /**
     * Map entity to response DTO.
     */
    private DeliveryReceiptResponse mapToResponse(DeliveryReceipt receipt, Parcel parcel, DeliveryProof proof) {
        return DeliveryReceiptResponse.builder()
                .receiptId(receipt.getId())
                .receiptNumber(receipt.getReceiptNumber())
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .receiverName(receipt.getReceiverName())
                .deliveryAddress(receipt.getDeliveryAddress())
                .deliveredAt(receipt.getDeliveredAt())
                .courierName(receipt.getCourierName())
                .totalAmount(receipt.getTotalAmount())
                .paymentCollected(receipt.isPaymentCollected())
                .paymentMethod(receipt.getPaymentMethod())
                .pdfUrl(receipt.getPdfUrl())
                .generatedAt(receipt.getGeneratedAt())
                .proofId(proof != null ? proof.getId() : null)
                .proofType(proof != null ? proof.getProofType().name() : null)
                .build();
    }
}
