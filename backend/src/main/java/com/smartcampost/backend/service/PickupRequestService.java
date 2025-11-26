package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.pickup.*;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface PickupRequestService {

    // US25 : Client demande un retrait à domicile
    PickupResponse createPickupRequest(CreatePickupRequest request);

    // Détail
    PickupResponse getPickupById(UUID pickupId);

    PickupResponse getPickupByParcelId(UUID parcelId);

    // Liste de mes pickups (client connecté)
    Page<PickupResponse> listMyPickups(int page, int size);

    // Liste des pickups d'un livreur (courier connecté)
    Page<PickupResponse> listCourierPickups(int page, int size);

    // Liste globale (admin/staff)
    Page<PickupResponse> listAllPickups(int page, int size);

    // US26 : assigner un courier
    PickupResponse assignCourier(UUID pickupId, AssignPickupCourierRequest request);

    // US27 : mise à jour de l'état
    PickupResponse updatePickupState(UUID pickupId, UpdatePickupStateRequest request);
}
