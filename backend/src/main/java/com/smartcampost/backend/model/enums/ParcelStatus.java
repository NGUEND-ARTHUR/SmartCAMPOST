package com.smartcampost.backend.model.enums;

/**
 * Parcel lifecycle statuses aligned with SmartCAMPOST specification.
 * Every status transition MUST be recorded via a ScanEvent.
 */
public enum ParcelStatus {
    CREATED,                    // Initial state when client registers parcel
    ACCEPTED,                   // Parcel validated by agent, final QR generated
    TAKEN_IN_CHARGE,            // Courier has picked up the parcel
    IN_TRANSIT,                 // Parcel is moving between hubs
    ARRIVED_HUB,                // Arrived at intermediate hub
    ARRIVED_DEST_AGENCY,        // Arrived at destination agency
    OUT_FOR_DELIVERY,           // Courier is delivering to recipient
    DELIVERED,                  // Successfully delivered to recipient
    PICKED_UP_AT_AGENCY,        // Recipient picked up at agency
    RETURNED_TO_SENDER,         // Returned to sender after delivery failure
    RETURNED,                   // Legacy: Generic returned status
    CANCELLED                   // Parcel cancelled
}
