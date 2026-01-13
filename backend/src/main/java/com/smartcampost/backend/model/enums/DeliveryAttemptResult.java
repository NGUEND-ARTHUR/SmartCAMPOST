package com.smartcampost.backend.model.enums;

/**
 * Result of a delivery attempt.
 */
public enum DeliveryAttemptResult {
    SUCCESS,
    FAILED_NOT_HOME,
    FAILED_WRONG_ADDRESS,
    FAILED_REFUSED,
    FAILED_ACCESS_DENIED,
    FAILED_OTHER
}
