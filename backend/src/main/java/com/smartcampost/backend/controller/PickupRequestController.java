package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.pickup.*;
import com.smartcampost.backend.dto.qr.TemporaryQrData;
import com.smartcampost.backend.service.PickupRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/pickups")
@RequiredArgsConstructor
@Tag(name = "Pickup Requests", description = "Home collection workflow endpoints")
public class PickupRequestController {

    private final PickupRequestService pickupRequestService;

    // US25 : client crée une demande de ramassage
    @PostMapping
    public ResponseEntity<PickupResponse> createPickup(
            @Valid @RequestBody CreatePickupRequest request
    ) {
        return ResponseEntity.ok(pickupRequestService.createPickupRequest(request));
    }

    // Détail par ID
    @GetMapping("/{pickupId}")
    public ResponseEntity<PickupResponse> getPickupById(@PathVariable UUID pickupId) {
        return ResponseEntity.ok(pickupRequestService.getPickupById(pickupId));
    }

    // Détail par parcelId
    @GetMapping("/by-parcel/{parcelId}")
    public ResponseEntity<PickupResponse> getPickupByParcel(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(pickupRequestService.getPickupByParcelId(parcelId));
    }

    // Liste de mes pickups (client)
    @GetMapping("/me")
    public ResponseEntity<Page<PickupResponse>> listMyPickups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(pickupRequestService.listMyPickups(page, size));
    }

    // Liste des pickups du courier connecté
    @GetMapping("/courier/me")
    public ResponseEntity<Page<PickupResponse>> listCourierPickups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(pickupRequestService.listCourierPickups(page, size));
    }

    // Liste globale (admin/staff/agent)
    @GetMapping
    public ResponseEntity<Page<PickupResponse>> listAllPickups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(pickupRequestService.listAllPickups(page, size));
    }

    // US26 : assigner un livreur
    @PostMapping("/{pickupId}/assign-courier")
    public ResponseEntity<PickupResponse> assignCourier(
            @PathVariable UUID pickupId,
            @Valid @RequestBody AssignPickupCourierRequest request
    ) {
        return ResponseEntity.ok(pickupRequestService.assignCourier(pickupId, request));
    }

    // US27 : mise à jour de l’état (REQUESTED → ASSIGNED → COMPLETED)
    @PatchMapping("/{pickupId}/state")
    public ResponseEntity<PickupResponse> updatePickupState(
            @PathVariable UUID pickupId,
            @Valid @RequestBody UpdatePickupStateRequest request
    ) {
        return ResponseEntity.ok(pickupRequestService.updatePickupState(pickupId, request));
    }
    // ==================== QR CODE WORKFLOW ====================

    @Operation(summary = "Generate temporary QR code for pickup",
               description = "Client receives QR code after submitting pickup request. Shows to agent when they arrive.")
    @PostMapping("/{pickupId}/qr")
    public ResponseEntity<TemporaryQrData> generatePickupQr(@PathVariable UUID pickupId) {
        return ResponseEntity.ok(pickupRequestService.generatePickupQrCode(pickupId));
    }

    @Operation(summary = "Get pickup details by temporary QR token",
               description = "Agent scans temporary QR to retrieve pickup details before confirming")
    @GetMapping("/qr/{temporaryQrToken}")
    public ResponseEntity<TemporaryQrData> getPickupByQr(@PathVariable String temporaryQrToken) {
        return ResponseEntity.ok(pickupRequestService.getPickupByTemporaryQr(temporaryQrToken));
    }

    @Operation(summary = "Confirm pickup with QR scan",
               description = "Agent confirms pickup after scanning QR, validating parcel, and optionally printing label")
    @PostMapping("/confirm")
    public ResponseEntity<ConfirmPickupResponse> confirmPickup(
            @Valid @RequestBody ConfirmPickupRequest request
    ) {
        return ResponseEntity.ok(pickupRequestService.confirmPickupWithQrScan(request));
    }}
