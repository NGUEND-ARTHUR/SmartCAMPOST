package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.dto.scan.OfflineSyncRequest;
import com.smartcampost.backend.dto.scan.OfflineSyncResponse;

import java.util.List;
import java.util.UUID;

public interface ScanEventService {

    // US38: record a scan event (with mandatory GPS)
    ScanEventResponse recordScanEvent(ScanEventCreateRequest request);

    // US39: full history for a parcel
    List<ScanEventResponse> getHistoryForParcel(UUID parcelId);

    // Offline sync: process batch of queued events
    OfflineSyncResponse syncOfflineEvents(OfflineSyncRequest request);

    // Get last scan event for parcel (current location)
    ScanEventResponse getLastScanEvent(UUID parcelId);
}
