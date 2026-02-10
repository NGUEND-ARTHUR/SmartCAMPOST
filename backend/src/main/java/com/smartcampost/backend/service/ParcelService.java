package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.parcel.*;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface ParcelService {

    // US20: client creates a parcel (generates partial QR)
    ParcelResponse createParcel(CreateParcelRequest request);

    // Detail by ID (admin/staff or owner client)
    ParcelDetailResponse getParcelById(UUID parcelId);

    // Detail by tracking (client or admin)
    ParcelDetailResponse getParcelByTracking(String trackingRef);

    // List parcels for connected client
    Page<ParcelResponse> listMyParcels(int page, int size);

    // Global list (admin/staff)
    Page<ParcelResponse> listParcels(int page, int size);

    // US21: update status (requires ScanEvent)
    ParcelResponse updateParcelStatus(UUID parcelId, UpdateParcelStatusRequest request);

    // Accept parcel (CREATED -> ACCEPTED) - simple version
    ParcelResponse acceptParcel(UUID parcelId);

    // Accept parcel with full validation
    ParcelResponse acceptParcelWithValidation(UUID parcelId, AcceptParcelRequest request);

    // Change delivery option (AGENCY <-> HOME)
    ParcelResponse changeDeliveryOption(UUID parcelId, ChangeDeliveryOptionRequest request);

    // Update metadata (photo + comment)
    ParcelResponse updateParcelMetadata(UUID parcelId, UpdateParcelMetadataRequest request);

    // Pre-validation corrections (only when not locked)
    ParcelResponse correctParcelBeforeValidation(UUID parcelId, ParcelCorrectionRequest request);

    // Validate parcel and generate final QR code (GPS required)
    ParcelResponse validateAndLockParcel(UUID parcelId, Double latitude, Double longitude);

    // Admin-only exceptional override after lock (audited)
    ParcelResponse adminOverrideLockedParcel(UUID parcelId, AdminParcelOverrideRequest request);

    // Check if parcel can be corrected
    boolean canCorrectParcel(UUID parcelId);
}
