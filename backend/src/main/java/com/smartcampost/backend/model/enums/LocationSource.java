package com.smartcampost.backend.model.enums;

/**
 * Location source for GPS tracking.
 * GPS from device is mandatory for all critical actions.
 */
public enum LocationSource {
    DEVICE_GPS,         // Location from scanning device GPS (required)
    MANUAL_ENTRY,       // Manual location entry (exceptional cases)
    NETWORK,            // Network-based location
    UNKNOWN             // Unknown source (legacy data)
}
