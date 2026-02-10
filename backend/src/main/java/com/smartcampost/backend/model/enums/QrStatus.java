package com.smartcampost.backend.model.enums;

/**
 * QR Code status following the two-step rule:
 * - PARTIAL: Generated at parcel creation by client, used for initial tracking
 * - FINAL: Generated after agent validation, locked and immutable
 */
public enum QrStatus {
    PARTIAL,    // Client-generated, pre-validation
    FINAL       // Agent-validated, locked
}
