package com.smartcampost.backend.model.enums;

/**
 * Status of an anomaly event through its lifecycle.
 */
public enum AnomalyStatus {
    DETECTED,
    INVESTIGATING,
    CONFIRMED,
    FALSE_POSITIVE,
    RESOLVED
}
