package com.smartcampost.backend.model.enums;

/**
 * Location source for GPS tracking.
 * Must match SQL ENUM('DEVICE_GPS','MANUAL','NETWORK','CACHED')
 * GPS from device is mandatory for all critical actions.
 */
public enum LocationSource {
    DEVICE_GPS,  // Location from scanning device GPS (required)
    MANUAL,      // Manual location entry (exceptional cases)
    NETWORK,     // Network-based location
    CACHED       // Cached location
}
