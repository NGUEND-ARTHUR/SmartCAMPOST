package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.DeliveryReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DeliveryReceiptRepository extends JpaRepository<DeliveryReceipt, UUID> {

    /**
     * Find receipt by parcel ID
     */
    Optional<DeliveryReceipt> findByParcel_Id(UUID parcelId);

    /**
     * Find receipt by receipt number
     */
    Optional<DeliveryReceipt> findByReceiptNumber(String receiptNumber);

    /**
     * Check if a receipt exists for a parcel
     */
    boolean existsByParcel_Id(UUID parcelId);
}
