package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.parcel.*;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface ParcelService {

    // US20: client crée un colis
    ParcelResponse createParcel(CreateParcelRequest request);

    // Détail par ID (admin/staff ou client propriétaire)
    ParcelDetailResponse getParcelById(UUID parcelId);

    // Détail par tracking (client ou admin)
    ParcelDetailResponse getParcelByTracking(String trackingRef);

    // Liste des colis du client connecté
    Page<ParcelResponse> listMyParcels(int page, int size);

    // Liste globale (admin/staff)
    Page<ParcelResponse> listParcels(int page, int size);

    // US21: mise à jour du statut
    ParcelResponse updateParcelStatus(UUID parcelId, UpdateParcelStatusRequest request);

    // 🔥 SPRINT 14: accepter un colis (CREATED -> ACCEPTED)
    ParcelResponse acceptParcel(UUID parcelId);

    // 🔥 SPRINT 14: changer l’option de livraison (AGENCY ↔ HOME)
    ParcelResponse changeDeliveryOption(UUID parcelId, ChangeDeliveryOptionRequest request);

    // 🔥 SPRINT 14: mettre à jour les métadonnées (photo + commentaire)
    ParcelResponse updateParcelMetadata(UUID parcelId, UpdateParcelMetadataRequest request);
}
