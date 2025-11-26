package com.smartcampost.backend.exception;

public enum ErrorCode {

    // Auth / User
    AUTH_INVALID_CREDENTIALS,
    AUTH_PHONE_EXISTS,
    AUTH_USER_NOT_FOUND,

    // OTP
    OTP_INVALID,
    OTP_EXPIRED,
    OTP_COOLDOWN,

    // Métier générique
    RESOURCE_NOT_FOUND,
    CONFLICT,
    VALIDATION_ERROR,
    BUSINESS_ERROR,

    // Internal
    INTERNAL_ERROR
}
