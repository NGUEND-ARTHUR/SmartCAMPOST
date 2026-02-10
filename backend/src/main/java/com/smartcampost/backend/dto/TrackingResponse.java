package com.smartcampost.backend.dto;

import com.smartcampost.backend.dto.scan.ScanEventResponse;

import java.time.OffsetDateTime;
import java.util.List;

public class TrackingResponse {
    public String parcelId;
    // Primary identifier displayed to users
    public String trackingRef;
    // Compatibility alias (some UI uses trackingNumber)
    public String trackingNumber;
    public String status;

    // Convenience snapshot derived from the last ScanEvent (if any)
    public CurrentLocation currentLocation;

    // Optional human-readable note from last scan event
    public String lastLocationNote;

    public OffsetDateTime updatedAt;

    // Full audit timeline (chronological)
    public List<ScanEventResponse> timeline;

    public static class CurrentLocation {
        public Double latitude;
        public Double longitude;
        public String locationSource;
        public String eventType;
        public OffsetDateTime updatedAt;
    }
}
