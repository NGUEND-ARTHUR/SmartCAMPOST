package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pricing_detail")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingDetail {

    @Id
    @Column(name = "pricing_detail_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parcel_id",
            nullable = false,
            referencedColumnName = "parcel_id",
            foreignKey = @ForeignKey(name = "fk_pd_parcel")
    )
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "tariff_id",
            nullable = false,
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_pd_tariff")
    )
    private Tariff tariff;

    @Column(name = "applied_price", nullable = false)
    private Double appliedPrice; // FLOAT en DB

    @Column(
            name = "applied_at",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant appliedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (appliedAt == null) {
            appliedAt = Instant.now();
        }
    }
}
