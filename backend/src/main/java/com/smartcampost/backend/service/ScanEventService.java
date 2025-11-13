package com.smartcampost.backend.service;

import com.smartcampost.backend.model.ScanEvent;

import java.util.List;
import java.util.UUID;

public interface ScanEventService {

    ScanEvent recordEvent(UUID parcelId,
                          UUID agencyId,
                          UUID staffOrAgentId,
                          String eventType,
                          String locationNote);

    List<ScanEvent> getTimelineForParcel(UUID parcelId);
}
