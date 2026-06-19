package com.smartcampost.backend.dto.logistics;

import lombok.Data;

import java.time.Instant;

@Data
public class GpsUpdateRequest {
    private String deviceId;
    private String imei;
    private String source;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double heading;
    private Instant timestamp;
    private String assignmentType;
    private String assignmentId;
    private String vehicleId;
}
