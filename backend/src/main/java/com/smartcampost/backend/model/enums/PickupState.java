package com.smartcampost.backend.model.enums;

public enum PickupState {
    REQUESTED,   // Client submitted pickup request
    ASSIGNED,    // Assigned to a driver/agent
    COMPLETED,   // Parcel successfully picked up
    CANCELLED    // Pickup request cancelled
}
