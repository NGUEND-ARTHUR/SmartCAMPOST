package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gps_tracker")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GpsTracker {

    @Id
    @Column(name = "tracker_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "device_id", nullable = false, unique = true, length = 80)
    private String deviceId;

    @Column(name = "imei", unique = true, length = 80)
    private String imei;

    @Column(name = "label", length = 150)
    private String label;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "assigned_type", length = 40)
    private String assignedType;

    @Column(name = "assigned_id", length = 80)
    private String assignedId;

    @Column(name = "vehicle_id", length = 80)
    private String vehicleId;

    @Column(name = "last_latitude", columnDefinition = "DECIMAL(10,8)")
    private Double lastLatitude;

    @Column(name = "last_longitude", columnDefinition = "DECIMAL(11,8)")
    private Double lastLongitude;

    @Column(name = "last_speed")
    private Double lastSpeed;

    @Column(name = "last_heading")
    private Double lastHeading;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
