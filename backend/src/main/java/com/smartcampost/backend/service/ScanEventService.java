package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.dto.scan.ScanEventResponse;

import java.util.List;
import java.util.UUID;

public interface ScanEventService {

    // US38 : ajouter un scan
    ScanEventResponse recordScanEvent(ScanEventCreateRequest request);

    // US39 : historique complet d’un colis
    List<ScanEventResponse> getHistoryForParcel(UUID parcelId);
}
