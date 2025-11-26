package com.smartcampost.backend.exception;

public enum ErrorCode {

    // ==========================
    // AUTHENTICATION / JWT
    // ==========================
    AUTH_INVALID_CREDENTIALS,
    AUTH_PHONE_EXISTS,
    AUTH_USER_NOT_FOUND,
    AUTH_UNAUTHORIZED,
    AUTH_FORBIDDEN,

    // ==========================
    // OTP
    // ==========================
    OTP_INVALID,
    OTP_EXPIRED,
    OTP_TOO_MANY_REQUESTS,

    // ==========================
    // CLIENT MODULE
    // ==========================
    CLIENT_NOT_FOUND,
    CLIENT_EMAIL_EXISTS,
    CLIENT_PHONE_EXISTS,
    CLIENT_CONFLICT,

    // ==========================
    // AGENT MODULE
    // ==========================
    AGENT_NOT_FOUND,
    AGENT_PHONE_EXISTS,
    AGENT_STAFF_NUMBER_EXISTS,
    AGENT_CONFLICT,

    // ==========================
    // AGENCY MODULE
    // ==========================
    AGENCY_NOT_FOUND,
    TARIFF_NOT_FOUND,
    TARIFF_CONFLICT,
    PRICING_TARIFF_NOT_FOUND,

    // ==========================
    // USERACCOUNT / GENERIC USER
    // ==========================
    USER_NOT_FOUND,
    USER_PHONE_EXISTS,
    USER_CONFLICT,

    // ==========================
// STAFF MODULE
// ==========================
    STAFF_NOT_FOUND,
    STAFF_EMAIL_EXISTS,
    STAFF_PHONE_EXISTS,
    STAFF_CONFLICT,

    // ==========================
// COURIER MODULE
// ==========================
    COURIER_NOT_FOUND,
    COURIER_PHONE_EXISTS,
    PICKUP_NOT_FOUND,
    PICKUP_ALREADY_EXISTS,
    PICKUP_INVALID_STATE,

    // ==========================
// ADDRESS / AGENCY / PARCEL
// ==========================
    ADDRESS_NOT_FOUND,
    PARCEL_NOT_FOUND,
    PARCEL_STATUS_INVALID,

    // ==========================
    // BUSINESS / VALIDATION
    // ==========================
    BUSINESS_ERROR,
    VALIDATION_ERROR
}
