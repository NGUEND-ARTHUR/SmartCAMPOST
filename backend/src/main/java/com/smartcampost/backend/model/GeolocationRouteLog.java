package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "geolocation_route_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeolocationRouteLog {

    @Id
    @Column(name = "route_log_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcel_id")
    private Parcel parcel;

    @Column(name = "origin_lat", precision = 9, scale = 6)
    private BigDecimal originLat;

    @Column(name = "origin_lng", precision = 9, scale = 6)
    private BigDecimal originLng;

    @Column(name = "dest_lat", precision = 9, scale = 6)
    private BigDecimal destLat;

    @Column(name = "dest_lng", precision = 9, scale = 6)
    private BigDecimal destLng;

    @Column(name = "distance_km")
    private Float distanceKm;

    @Column(name = "duration_min")
    private Integer durationMin;

    @Column(name = "provider", length = 50)
    private String provider; // 'GOOGLE', 'OSM', 'INTERNAL'

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
