package com.smartcampost.backend.model.enums;

/**
 * Scan event types aligned with SmartCAMPOST specification.
 * ScanEvent is the single source of truth for parcel timeline.
 */
public enum ScanEventType {
    // Parcel lifecycle events
    CREATED,                    // Parcel created by client
    ACCEPTED,                   // Parcel validated by agent, final QR generated
    AT_ORIGIN_AGENCY,           // Parcel dropped off at origin agency
    TAKEN_IN_CHARGE,            // Courier picked up the parcel
    IN_TRANSIT,                 // Parcel in transit
    ARRIVED_HUB,                // Arrived at intermediate hub
    DEPARTED_HUB,               // Departed from hub
    ARRIVED_DESTINATION,        // Arrived at destination agency
    ARRIVED_DEST_AGENCY,        // Alias for destination agency arrival
    OUT_FOR_DELIVERY,           // Courier is delivering
    DELIVERED,                  // Successfully delivered
    PICKED_UP_AT_AGENCY,        // Recipient picked up at agency
    RETURNED,                   // Returned to sender
    RETURNED_TO_SENDER,         // Returned to sender after failure
    DELIVERY_FAILED,            // Delivery attempt failed
    RESCHEDULED,                // Delivery rescheduled
    CANCELLED,                  // Parcel cancelled (client/admin)
    // Verification events
    OTP_SENT,                   // OTP sent for delivery verification
    OTP_VERIFIED,               // OTP verified successfully
    PROOF_CAPTURED              // Photo/signature proof captured
}
