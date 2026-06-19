package com.smartcampost.backend.dto.logistics;

import lombok.Data;

@Data
public class GpsTrackerRequest {
    private String deviceId;
    private String imei;
    private String label;
    private Boolean active;
    private String assignedType;
    private String assignedId;
    private String vehicleId;
}
