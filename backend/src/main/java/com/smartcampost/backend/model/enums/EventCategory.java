package com.smartcampost.backend.model.enums;

/**
 * Category of system events for event-driven architecture.
 */
public enum EventCategory {
    SCAN,
    STATUS_CHANGE,
    DELAY,
    ANOMALY,
    OVERLOAD,
    SYSTEM,
    USER_ACTION,
    AI_ACTION,
    PAYMENT,
    NOTIFICATION
}
