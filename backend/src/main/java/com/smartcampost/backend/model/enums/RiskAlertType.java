package com.smartcampost.backend.model.enums;

/**
 * Type of risk alert — values must match the frontend CreateRiskPage RISK_TYPES list.
 */
public enum RiskAlertType {
    FRAUD,
    AML,
    OPERATIONAL,
    REGULATORY,
    CREDIT,
    MARKET,
    OTHER
}
