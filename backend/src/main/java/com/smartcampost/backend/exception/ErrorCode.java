package com.smartcampost.backend.exception;

public enum ErrorCode {

    // =====================================================
    // AUTHENTICATION / AUTHORIZATION / JWT
    // =====================================================
    AUTH_INVALID_CREDENTIALS,
    AUTH_PHONE_EXISTS,
    AUTH_USER_NOT_FOUND,
    AUTH_UNAUTHORIZED,
    AUTH_FORBIDDEN,

    // =====================================================
    // OTP
    // =====================================================
    OTP_INVALID,
    OTP_EXPIRED,
    OTP_TOO_MANY_REQUESTS,

    // =====================================================
    // CLIENT MODULE
    // =====================================================
    CLIENT_NOT_FOUND,
    CLIENT_EMAIL_EXISTS,
    CLIENT_PHONE_EXISTS,
    CLIENT_CONFLICT,

    // =====================================================
    // USER ACCOUNT (GENERIC USER)
    // =====================================================
    USER_NOT_FOUND,
    USER_PHONE_EXISTS,
    USER_CONFLICT,

    // =====================================================
    // AGENT MODULE
    // =====================================================
    AGENT_NOT_FOUND,
    AGENT_PHONE_EXISTS,
    AGENT_STAFF_NUMBER_EXISTS,
    AGENT_CONFLICT,

    // =====================================================
    // STAFF MODULE
    // =====================================================
    STAFF_NOT_FOUND,
    STAFF_EMAIL_EXISTS,
    STAFF_PHONE_EXISTS,
    STAFF_CONFLICT,

    // =====================================================
    // COURIER MODULE
    // =====================================================
    COURIER_NOT_FOUND,
    COURIER_PHONE_EXISTS,

    // =====================================================
    // ADDRESS / AGENCY / PARCEL
    // =====================================================
    ADDRESS_NOT_FOUND,
    AGENCY_NOT_FOUND,
    PARCEL_NOT_FOUND,
    PARCEL_STATUS_INVALID,

    // =====================================================
    // TARIFF & PRICING
    // =====================================================
    TARIFF_NOT_FOUND,
    TARIFF_CONFLICT,
    PRICING_TARIFF_NOT_FOUND,
    PRICING_NOT_FOUND,

    // =====================================================
    // PAYMENT MODULE
    // =====================================================
    PAYMENT_NOT_FOUND,
    PAYMENT_ALREADY_PROCESSED,
    PAYMENT_GATEWAY_ERROR,

    // =====================================================
    // PICKUP REQUEST MODULE
    // =====================================================
    PICKUP_NOT_FOUND,
    PICKUP_ALREADY_EXISTS,
    PICKUP_INVALID_STATE,

    // =====================================================
    // NOTIFICATION MODULE
    // =====================================================
    NOTIFICATION_NOT_FOUND,
    NOTIFICATION_SEND_FAILED,
    NOTIFICATION_CHANNEL_UNSUPPORTED,

    // =====================================================
    // SUPPORT / TICKETING (SPRINT 13)
    // =====================================================
    TICKET_NOT_FOUND,
    TICKET_CONFLICT,
    TICKET_STATUS_INVALID,

    // =====================================================
    // REFUNDS & CHARGEBACKS (SPRINT 13)
    // =====================================================
    REFUND_NOT_FOUND,
    REFUND_CONFLICT,
    REFUND_ALREADY_PROCESSED,
    CHARGEBACK_NOT_FOUND,
    CHARGEBACK_CONFLICT,

    // =====================================================
    // COMPLIANCE / AML / RISK (SPRINT 13)
    // =====================================================
    COMPLIANCE_ALERT_NOT_FOUND,
    COMPLIANCE_RULE_VIOLATION,
    AML_ALERT_NOT_FOUND,
    RISK_ALERT_NOT_FOUND,
    RISK_EVALUATION_FAILED,
    ACCOUNT_ALREADY_FROZEN,
    ACCOUNT_NOT_FROZEN,

    // =====================================================
    // AI / ADVANCED ANALYTICS (SPRINT 13)
    // =====================================================
    ANALYTICS_ERROR,
    ETA_CALCULATION_FAILED,
    ANOMALY_DETECTION_FAILED,

    // =====================================================
    // GEOLOCATION / ROUTING (SPRINT 13)
    // =====================================================
    GEOLOCATION_ERROR,
    ROUTE_NOT_FOUND,

    // =====================================================
    // USSD INTEGRATION (SPRINT 13)
    // =====================================================
    USSD_SESSION_NOT_FOUND,
    USSD_MENU_NOT_FOUND,
    USSD_GATEWAY_ERROR,

    // =====================================================
    // DASHBOARDS / INTEGRATIONS (SPRINT 13)
    // =====================================================
    DASHBOARD_ERROR,
    INTEGRATION_CONFIG_NOT_FOUND,
    INTEGRATION_GATEWAY_ERROR,

    // =====================================================
    // GENERIC BUSINESS / VALIDATION / INTERNAL
    // =====================================================
    BUSINESS_ERROR,
    VALIDATION_ERROR,
    INTERNAL_ERROR
}
