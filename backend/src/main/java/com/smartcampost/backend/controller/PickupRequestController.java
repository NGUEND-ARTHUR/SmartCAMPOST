package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.pickup.*;
import com.smartcampost.backend.service.PickupRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/pickups")
@RequiredArgsConstructor
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
}
