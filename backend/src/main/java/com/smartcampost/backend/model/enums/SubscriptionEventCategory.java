package com.smartcampost.backend.model.enums;

/**
 * Event categories for event subscriptions.
 */
public enum SubscriptionEventCategory {
    SCAN,
    STATUS_CHANGE,
    DELAY,
    ANOMALY,
    OVERLOAD,
    SYSTEM,
    USER_ACTION,
    AI_ACTION,
    PAYMENT,
    NOTIFICATION,
    ALL
}
