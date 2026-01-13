package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.pickup.*;
import com.smartcampost.backend.dto.qr.TemporaryQrData;
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

    // ==================== NEW: QR CODE WORKFLOW ====================

    /**
     * Generate temporary QR code for a pickup request.
     * Called after client submits pickup request.
     * Returns QR data that client can show to agent.
     */
    TemporaryQrData generatePickupQrCode(UUID pickupId);

    /**
     * Confirm pickup via QR scan.
     * Agent scans temporary QR, validates parcel, and confirms pickup.
     * Transitions pickup to COMPLETED and parcel to ACCEPTED.
     * Returns permanent QR code and optional label data.
     */
    ConfirmPickupResponse confirmPickupWithQrScan(ConfirmPickupRequest request);

    /**
     * Get pickup details by scanning temporary QR token.
     * Used by agent before confirming pickup.
     */
    TemporaryQrData getPickupByTemporaryQr(String temporaryQrToken);
}
