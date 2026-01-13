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

    // 🔥 SPRINT 14: accepter un colis (CREATED -> ACCEPTED) - simple version
    @PatchMapping("/{parcelId}/accept")
    public ResponseEntity<ParcelResponse> acceptParcel(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(parcelService.acceptParcel(parcelId));
    }

    // 🔥 SPRINT 15: accepter un colis avec validation complète
    // Agent/Courier validates description, weight, adds photo and validation comments
    @PatchMapping("/{parcelId}/validate")
    public ResponseEntity<ParcelResponse> acceptParcelWithValidation(
            @PathVariable UUID parcelId,
            @Valid @RequestBody AcceptParcelRequest request
    ) {
        return ResponseEntity.ok(parcelService.acceptParcelWithValidation(parcelId, request));
    }

    // 🔥 SPRINT 14: changer l’option de livraison (AGENCY ↔ HOME)
    @PatchMapping("/{parcelId}/delivery-option")
    public ResponseEntity<ParcelResponse> changeDeliveryOption(
            @PathVariable UUID parcelId,
            @Valid @RequestBody ChangeDeliveryOptionRequest request
    ) {
        return ResponseEntity.ok(parcelService.changeDeliveryOption(parcelId, request));
    }

    // 🔥 SPRINT 14: mettre à jour photo + commentaire
    @PatchMapping("/{parcelId}/metadata")
    public ResponseEntity<ParcelResponse> updateParcelMetadata(
            @PathVariable UUID parcelId,
            @RequestBody UpdateParcelMetadataRequest request
    ) {
        return ResponseEntity.ok(parcelService.updateParcelMetadata(parcelId, request));
    }
}
