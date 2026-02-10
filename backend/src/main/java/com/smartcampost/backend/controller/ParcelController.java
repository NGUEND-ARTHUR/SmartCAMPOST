package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.parcel.*;
import com.smartcampost.backend.service.ParcelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/parcels")
@RequiredArgsConstructor
public class ParcelController {

    private final ParcelService parcelService;

    // US20: client creates a parcel (generates partial QR)
    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ParcelResponse> createParcel(
            @Valid @RequestBody CreateParcelRequest request
    ) {
        return ResponseEntity.ok(parcelService.createParcel(request));
    }

    // List parcels for connected client
    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Page<ParcelResponse>> listMyParcels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(parcelService.listMyParcels(page, size));
    }

    // Parcel detail by ID
    @GetMapping("/{parcelId}")
    public ResponseEntity<ParcelDetailResponse> getParcelById(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(parcelService.getParcelById(parcelId));
    }

    // Search by trackingRef
    @GetMapping("/tracking/{trackingRef}")
    public ResponseEntity<ParcelDetailResponse> getParcelByTracking(
            @PathVariable String trackingRef
    ) {
        return ResponseEntity.ok(parcelService.getParcelByTracking(trackingRef));
    }

    // Global list (admin/staff)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<Page<ParcelResponse>> listParcels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(parcelService.listParcels(page, size));
    }

    // US21: update status
    @PatchMapping("/{parcelId}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ParcelResponse> updateParcelStatus(
            @PathVariable UUID parcelId,
            @Valid @RequestBody UpdateParcelStatusRequest request
    ) {
        return ResponseEntity.ok(parcelService.updateParcelStatus(parcelId, request));
    }

    // Accept parcel (CREATED -> ACCEPTED) - simple version
    @PatchMapping("/{parcelId}/accept")
    @PreAuthorize("hasAnyRole('AGENT','COURIER','STAFF','ADMIN')")
    public ResponseEntity<ParcelResponse> acceptParcel(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(parcelService.acceptParcel(parcelId));
    }

    // Accept parcel with full validation
    @PatchMapping("/{parcelId}/validate")
    @PreAuthorize("hasAnyRole('AGENT','COURIER','STAFF','ADMIN')")
    public ResponseEntity<ParcelResponse> acceptParcelWithValidation(
            @PathVariable UUID parcelId,
            @Valid @RequestBody AcceptParcelRequest request
    ) {
        return ResponseEntity.ok(parcelService.acceptParcelWithValidation(parcelId, request));
    }

    // Change delivery option (AGENCY <-> HOME)
    @PatchMapping("/{parcelId}/delivery-option")
    public ResponseEntity<ParcelResponse> changeDeliveryOption(
            @PathVariable UUID parcelId,
            @Valid @RequestBody ChangeDeliveryOptionRequest request
    ) {
        return ResponseEntity.ok(parcelService.changeDeliveryOption(parcelId, request));
    }

    // Update metadata (photo + comment)
    @PatchMapping("/{parcelId}/metadata")
    public ResponseEntity<ParcelResponse> updateParcelMetadata(
            @PathVariable UUID parcelId,
            @RequestBody UpdateParcelMetadataRequest request
    ) {
        return ResponseEntity.ok(parcelService.updateParcelMetadata(parcelId, request));
    }

    // Pre-validation corrections (only when not locked)
    @PatchMapping("/{parcelId}/correct")
    @PreAuthorize("hasAnyRole('AGENT','COURIER','STAFF','ADMIN')")
    public ResponseEntity<ParcelResponse> correctParcelBeforeValidation(
            @PathVariable UUID parcelId,
            @Valid @RequestBody ParcelCorrectionRequest request
    ) {
        return ResponseEntity.ok(parcelService.correctParcelBeforeValidation(parcelId, request));
    }

    // Validate parcel and generate final QR code (locks the parcel)
    @PostMapping("/{parcelId}/validate-and-lock")
    @PreAuthorize("hasAnyRole('AGENT','COURIER','STAFF','ADMIN')")
    public ResponseEntity<ParcelResponse> validateAndLockParcel(
            @PathVariable UUID parcelId,
            @RequestParam Double latitude,
            @RequestParam Double longitude
    ) {
        return ResponseEntity.ok(parcelService.validateAndLockParcel(parcelId, latitude, longitude));
    }

    // Check if parcel can be corrected
    @GetMapping("/{parcelId}/can-correct")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> canCorrectParcel(
            @PathVariable UUID parcelId
    ) {
        boolean canCorrect = parcelService.canCorrectParcel(parcelId);
        return ResponseEntity.ok(Map.of("canCorrect", canCorrect));
    }

    // Admin-only exceptional override after lock (audited)
    @PatchMapping("/{parcelId}/admin-override")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParcelResponse> adminOverrideLockedParcel(
            @PathVariable UUID parcelId,
            @Valid @RequestBody AdminParcelOverrideRequest request
    ) {
        return ResponseEntity.ok(parcelService.adminOverrideLockedParcel(parcelId, request));
    }
}
