package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.parcel.*;
import com.smartcampost.backend.service.ParcelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/parcels")
@RequiredArgsConstructor
public class ParcelController {

    private final ParcelService parcelService;

    // US20: client crée un colis
    @PostMapping
    public ResponseEntity<ParcelResponse> createParcel(
            @Valid @RequestBody CreateParcelRequest request
    ) {
        return ResponseEntity.ok(parcelService.createParcel(request));
    }

    // Liste des colis du client connecté
    @GetMapping("/me")
    public ResponseEntity<Page<ParcelResponse>> listMyParcels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(parcelService.listMyParcels(page, size));
    }

    // Détail d’un colis par ID (client propriétaire ou admin/staff)
    @GetMapping("/{parcelId}")
    public ResponseEntity<ParcelDetailResponse> getParcelById(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(parcelService.getParcelById(parcelId));
    }

    // Recherche par trackingRef
    @GetMapping("/tracking/{trackingRef}")
    public ResponseEntity<ParcelDetailResponse> getParcelByTracking(
            @PathVariable String trackingRef
    ) {
        return ResponseEntity.ok(parcelService.getParcelByTracking(trackingRef));
    }

    // Liste globale (admin/staff)
    @GetMapping
    public ResponseEntity<Page<ParcelResponse>> listParcels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(parcelService.listParcels(page, size));
    }

    // US21: mise à jour du statut
    @PatchMapping("/{parcelId}/status")
    public ResponseEntity<ParcelResponse> updateParcelStatus(
            @PathVariable UUID parcelId,
            @Valid @RequestBody UpdateParcelStatusRequest request
    ) {
        return ResponseEntity.ok(parcelService.updateParcelStatus(parcelId, request));
    }
}
