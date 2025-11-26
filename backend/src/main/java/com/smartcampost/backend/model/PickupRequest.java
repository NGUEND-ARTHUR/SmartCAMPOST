package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.PickupRequestState;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pickup_request")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PickupRequest {

    @Id
    @Column(name = "pickup_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parcel_id",
            nullable = false,
            unique = true,
            referencedColumnName = "parcel_id",
            foreignKey = @ForeignKey(name = "fk_pickup_parcel")
    )
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "courier_id",
            referencedColumnName = "courier_id",
            foreignKey = @ForeignKey(name = "fk_pickup_courier")
    )
    private Courier courier; // nullable

    @Column(name = "requested_date", nullable = false)
    private LocalDate requestedDate;

    @Column(name = "time_window", nullable = false, length = 30)
    private String timeWindow;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false)
    private PickupRequestState state; // REQUESTED, ASSIGNED, COMPLETED, CANCELLED

    @Column(name = "comment", length = 255)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (state == null) {
            state = PickupRequestState.REQUESTED;
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
