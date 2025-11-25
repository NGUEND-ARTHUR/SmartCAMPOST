package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.DeliveryProofType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "delivery_proof")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryProof {

    @Id
    @Column(name = "pod_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parcel_id",
            nullable = false,
            unique = true,
            referencedColumnName = "parcel_id",
            foreignKey = @ForeignKey(name = "fk_pod_parcel")
    )
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "courier_id",
            referencedColumnName = "courier_id",
            foreignKey = @ForeignKey(name = "fk_pod_courier")
    )
    private Courier courier; // nullable (SET NULL)

    @Enumerated(EnumType.STRING)
    @Column(name = "proof_type", nullable = false)
    private DeliveryProofType proofType; // SIGNATURE, PHOTO, OTP

    @Column(
            name = "timestamp",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant timestamp;

    @Column(name = "details", length = 255)
    private String details;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID(); // Converti automatiquement en BINARY(16)
        }
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}
