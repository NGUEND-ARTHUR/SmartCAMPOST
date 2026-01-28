package com.smartcampost.backend.service;

import com.smartcampost.backend.model.ScanEvent;

import java.util.List;
import java.util.UUID;

public interface ScanService {
    ScanEvent recordScan(ScanEvent evt);
    List<ScanEvent> getScanEventsForParcel(UUID parcelId);
}
