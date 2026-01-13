package com.smartcampost.backend.model.enums;

/**
 * Type of QR verification token.
 */
public enum QrTokenType {
    /**
     * Permanent QR code for parcels (never expires)
     */
    PERMANENT,

    /**
     * Temporary QR code for pickup requests (expires after 48h)
     */
    TEMPORARY
}
