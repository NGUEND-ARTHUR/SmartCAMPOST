package com.smartcampost.backend.model.enums;

/**
 * Location mode for GPS requirements.
 * GPS is mandatory for all critical business actions.
 */
public enum LocationMode {
    GPS_DEFAULT,        // Default: location captured from device GPS
    MANUAL_OVERRIDE     // Manual override: user specified location via map/address
}
