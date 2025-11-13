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
    @Column(name = "pricing_detail_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcel_id", nullable = false)
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tariff_id", nullable = false)
    private Tariff tariff;

    @Column(name = "applied_price", nullable = false, precision = 12, scale = 2)
    private Double appliedPrice;

    @Column(name = "applied_at", nullable = false)
    private Instant appliedAt;
}
