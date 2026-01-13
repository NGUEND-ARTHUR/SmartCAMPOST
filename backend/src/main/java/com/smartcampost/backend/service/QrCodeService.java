package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.qr.QrCodeData;
import com.smartcampost.backend.dto.qr.TemporaryQrData;
import com.smartcampost.backend.dto.qr.QrLabelData;

import java.util.UUID;

/**
 * Service for QR Code generation and management.
 * Supports both permanent (parcel) and temporary (pickup) QR codes.
 */
public interface QrCodeService {

    // ================== PERMANENT QR (PARCEL) ==================

    /**
     * Generate QR code data for a parcel (complete traceability info)
     */
    QrCodeData generateQrCode(UUID parcelId);

    /**
     * Get QR code data by tracking reference
     */
    QrCodeData getQrCodeByTracking(String trackingRef);

    /**
     * Generate QR code as Base64 encoded PNG image
     */
    String generateQrCodeImage(UUID parcelId);

    /**
     * Generate QR code image by tracking reference
     */
    String generateQrCodeImageByTracking(String trackingRef);

    // ================== TEMPORARY QR (PICKUP REQUEST) ==================

    /**
     * Generate a temporary QR code when client submits a pickup request.
     * This QR is shown to the client before agent arrives.
     */
    TemporaryQrData generateTemporaryQrForPickup(UUID pickupId);

    /**
     * Validate a temporary QR code scanned by agent during pickup.
     * Returns the pickup details if valid.
     */
    TemporaryQrData validateTemporaryQr(String temporaryQrToken);

    /**
     * Convert temporary QR to permanent QR after agent confirms pickup.
     * Marks the pickup as COMPLETED and generates the definitive parcel QR.
     */
    QrCodeData convertTemporaryToPermanent(UUID pickupId);

    // ================== QR LABEL FOR PRINTING ==================

    /**
     * Generate printable label data with CAMPOST branding
     */
    QrLabelData generatePrintableLabel(UUID parcelId);

    /**
     * Generate printable label by tracking reference
     */
    QrLabelData generatePrintableLabelByTracking(String trackingRef);
}
