package com.smartcampost.backend.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class TrackingResponse {
    public String parcelId;
    public String trackingNumber;
    public String status;
    public String lastLocation;
    public OffsetDateTime updatedAt;
    public List<Object> timeline; // simplified; can be ScanEvent DTOs
}
