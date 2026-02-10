package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.delivery.*;

import java.util.UUID;

/**
 * Service for managing the complete delivery workflow.
 * Orchestrates OUT_FOR_DELIVERY, OTP verification, and proof capture.
 */
public interface DeliveryService {

    /**
     * Start delivery process - marks parcel as OUT_FOR_DELIVERY.
     * Courier scans parcel QR at destination agency before going out.
     */
    StartDeliveryResponse startDelivery(StartDeliveryRequest request);

    /**
     * Send OTP to recipient before delivery.
     * Triggered when courier is near delivery location.
     */
    void sendDeliveryOtp(UUID parcelId);

    /**
     * Send/re-send OTP to recipient and record an OTP_SENT ScanEvent (GPS required).
     */
    void sendDeliveryOtp(UUID parcelId, Double latitude, Double longitude, String notes);

    /**
     * Complete delivery with full verification.
     * Verifies OTP, captures proof, and marks parcel as DELIVERED.
     */
    CompleteDeliveryResponse completeDelivery(CompleteDeliveryRequest request);

    /**
     * Get delivery status and details for a parcel.
     */
    DeliveryStatusResponse getDeliveryStatus(UUID parcelId);

    /**
     * Mark delivery as failed (recipient not available, refused, etc.)
     */
    DeliveryStatusResponse markDeliveryFailed(UUID parcelId, String reason, Double latitude, Double longitude, String notes);

    /**
     * Reschedule delivery for a later date.
     */
    DeliveryStatusResponse rescheduleDelivery(UUID parcelId, RescheduleDeliveryRequest request);

    /**
     * Agency pickup flow: QR + OTP verification then mark as PICKED_UP_AT_AGENCY.
     */
    PickupAtAgencyResponse pickupAtAgency(PickupAtAgencyRequest request);

    /**
     * Return to sender workflow.
     */
    DeliveryStatusResponse returnToSender(UUID parcelId, ReturnToSenderRequest request);
}
