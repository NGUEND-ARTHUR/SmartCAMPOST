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
    @Column(name = "courier_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone", nullable = false, length = 30, unique = true)
    private String phone;

    @Column(name = "vehicle_id", length = 50)
    private String vehicleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CourierStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
