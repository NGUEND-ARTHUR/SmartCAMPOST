package com.smartcampost.backend.model.enums;

public enum NotificationType {
    // Existing (DO NOT TOUCH)
    PICKUP_REQUESTED,
    PICKUP_COMPLETED,
    PARCEL_DELIVERED,
    MANUAL,

    // NEW (added according to Sprint 14 – following same style)
    PARCEL_CREATED,
    PARCEL_ACCEPTED,
    PARCEL_STATUS_CHANGE,
    PARCEL_IN_TRANSIT,
    PARCEL_ARRIVED_DESTINATION,
    PARCEL_OUT_FOR_DELIVERY,
    PARCEL_RETURNED,

    PAYMENT_CONFIRMED,
    DELIVERY_OPTION_CHANGED,

    REMINDER_NOT_COLLECTED,

    // 🔥 For delivery OTP SMS
    DELIVERY_OTP,

    // 🔥 NEW: For delivery rescheduling and failed attempts
    DELIVERY_RESCHEDULED,
    DELIVERY_ATTEMPT_FAILED
}
