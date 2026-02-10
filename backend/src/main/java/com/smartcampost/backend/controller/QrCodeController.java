package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.qr.*;
import com.smartcampost.backend.service.QrCodeService;
import com.smartcampost.backend.service.QrSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/qr")
@RequiredArgsConstructor
@Tag(name = "QR Code", description = "QR code generation and validation endpoints")
public class QrCodeController {

    private final QrCodeService qrCodeService;
    private final QrSecurityService qrSecurityService;

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

    // ==================== SECURE QR VERIFICATION (ANTI-FORGERY) ====================

    @Operation(summary = "Verify QR code authenticity (anti-forgery)",
               description = "Server-side verification of scanned QR code. Validates the unique token and HMAC signature to detect forgery attempts.")
    @PostMapping("/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<QrVerificationResponse> verifyQrCode(
            @RequestBody QrVerificationRequest request,
            HttpServletRequest httpRequest) {
        
        // Populate client info for audit trail
        request.setClientIp(getClientIp(httpRequest));
        request.setUserAgent(httpRequest.getHeader("User-Agent"));
        
        return ResponseEntity.ok(qrSecurityService.verifyQrCode(request));
    }

    @Operation(summary = "Verify QR code from scanned content",
               description = "Parses and verifies the raw content scanned from a QR code. Returns verification status and parcel/pickup details if valid.")
    @GetMapping("/verify/{qrContent}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<QrVerificationResponse> verifyQrCodeContent(
            @PathVariable String qrContent,
            HttpServletRequest httpRequest) {
        
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        return ResponseEntity.ok(qrSecurityService.verifyQrCodeContent(qrContent, clientIp, userAgent));
    }

    @Operation(summary = "Generate secure QR code for parcel",
               description = "Generates a new secure QR code with anti-forgery token. Invalidates any previous QR codes for this parcel.")
    @PostMapping("/secure/{parcelId}")
    @PreAuthorize("hasAnyRole('AGENT','COURIER','STAFF','ADMIN')")
    public ResponseEntity<SecureQrPayload> generateSecureQrCode(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(qrSecurityService.regenerateToken(parcelId));
    }

    @Operation(summary = "Revoke QR code",
               description = "Revokes a QR code, making it invalid for future scans. Use when a QR code is compromised or needs to be replaced.")
    @DeleteMapping("/revoke/{token}")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<Void> revokeQrCode(
            @PathVariable String token,
            @RequestParam(defaultValue = "Manual revocation") String reason) {
        qrSecurityService.revokeToken(token, reason);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Revoke all QR codes for a parcel",
               description = "Revokes all QR codes associated with a parcel. Use when regenerating QR codes or when parcel security is compromised.")
    @DeleteMapping("/revoke/parcel/{parcelId}")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<Void> revokeAllQrCodesForParcel(
            @PathVariable UUID parcelId,
            @RequestParam(defaultValue = "Bulk revocation") String reason) {
        qrSecurityService.revokeAllTokensForParcel(parcelId, reason);
        return ResponseEntity.noContent().build();
    }

    // ==================== HELPER METHODS ====================

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
