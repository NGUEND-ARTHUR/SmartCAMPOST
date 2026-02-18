package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.CourierStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "courier")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Courier {

    @Id
    @Column(name = "courier_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "agency_id",
            referencedColumnName = "agency_id",
            foreignKey = @ForeignKey(name = "fk_courier_agency")
    )
    private Agency agency;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone", nullable = false, length = 30, unique = true)
    private String phone;

    @Column(name = "vehicle_id", length = 50)
    private String vehicleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CourierStatus status; // AVAILABLE, INACTIVE, ON_ROUTE

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant createdAt;

    // --------------------------------------------------
    //  🔥 AI/REAL-TIME TRACKING FIELDS
    // --------------------------------------------------
    @Column(name = "current_latitude", columnDefinition = "DECIMAL(10,8)")
    private Double currentLatitude;

    @Column(name = "current_longitude", columnDefinition = "DECIMAL(11,8)")
    private Double currentLongitude;

    @Column(name = "last_location_at")
    private Instant lastLocationAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID(); // Converti automatiquement en BINARY(16)
        }
        if (createdAt == null) {
            createdAt = Instant.now(); // NOT NULL → cohérent
        }
    }
}
