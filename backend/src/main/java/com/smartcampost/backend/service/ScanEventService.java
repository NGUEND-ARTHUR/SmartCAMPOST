package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.dto.scan.ScanEventResponse;

import java.util.List;
import java.util.UUID;

public interface ScanEventService {

    /**
     * Enregistrer un nouvel événement de scan pour un colis.
     */
    ScanEventResponse recordScanEvent(ScanEventCreateRequest request);

    /**
     * Récupérer l’historique des scans pour un colis donné.
     */
    List<ScanEventResponse> getHistoryForParcel(UUID parcelId);
}
