package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.qr.QrCodeData;
import com.smartcampost.backend.dto.qr.QrLabelData;
import com.smartcampost.backend.dto.qr.TemporaryQrData;
import com.smartcampost.backend.service.QrCodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/qr")
@RequiredArgsConstructor
@Tag(name = "QR Code", description = "QR code generation and validation endpoints")
public class QrCodeController {

    private final QrCodeService qrCodeService;

    // ==================== PERMANENT QR (PARCEL) ====================

    @Operation(summary = "Get QR code data for a parcel")
    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<QrCodeData> getQrCodeData(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(qrCodeService.generateQrCode(parcelId));
    }

    @Operation(summary = "Get QR code data by tracking reference")
    @GetMapping("/tracking/{trackingRef}")
    public ResponseEntity<QrCodeData> getQrCodeByTracking(@PathVariable String trackingRef) {
        return ResponseEntity.ok(qrCodeService.getQrCodeByTracking(trackingRef));
    }

    @Operation(summary = "Get QR code image as Base64 PNG")
    @GetMapping("/parcel/{parcelId}/image")
    public ResponseEntity<String> getQrCodeImage(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(qrCodeService.generateQrCodeImage(parcelId));
    }

    @Operation(summary = "Get QR code image by tracking reference")
    @GetMapping("/tracking/{trackingRef}/image")
    public ResponseEntity<String> getQrCodeImageByTracking(@PathVariable String trackingRef) {
        return ResponseEntity.ok(qrCodeService.generateQrCodeImageByTracking(trackingRef));
    }

    // ==================== TEMPORARY QR (PICKUP) ====================

    @Operation(summary = "Generate temporary QR for pickup request",
               description = "Client receives this QR after submitting pickup request. Agent scans to confirm pickup.")
    @PostMapping("/pickup/{pickupId}/temporary")
    public ResponseEntity<TemporaryQrData> generateTemporaryQr(@PathVariable UUID pickupId) {
        return ResponseEntity.ok(qrCodeService.generateTemporaryQrForPickup(pickupId));
    }

    @Operation(summary = "Validate temporary QR scanned by agent",
               description = "Agent scans temporary QR to retrieve pickup details")
    @GetMapping("/validate/{temporaryToken}")
    public ResponseEntity<TemporaryQrData> validateTemporaryQr(@PathVariable String temporaryToken) {
        return ResponseEntity.ok(qrCodeService.validateTemporaryQr(temporaryToken));
    }

    @Operation(summary = "Convert temporary QR to permanent after pickup confirmation",
               description = "After agent validates pickup, generates permanent QR for the parcel")
    @PostMapping("/pickup/{pickupId}/convert")
    public ResponseEntity<QrCodeData> convertToPermanentQr(@PathVariable UUID pickupId) {
        return ResponseEntity.ok(qrCodeService.convertTemporaryToPermanent(pickupId));
    }

    // ==================== PRINTABLE LABEL ====================

    @Operation(summary = "Get printable label data with CAMPOST branding")
    @GetMapping("/label/{parcelId}")
    public ResponseEntity<QrLabelData> getPrintableLabel(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(qrCodeService.generatePrintableLabel(parcelId));
    }

    @Operation(summary = "Get printable label by tracking reference")
    @GetMapping("/label/tracking/{trackingRef}")
    public ResponseEntity<QrLabelData> getPrintableLabelByTracking(@PathVariable String trackingRef) {
        return ResponseEntity.ok(qrCodeService.generatePrintableLabelByTracking(trackingRef));
    }
}
