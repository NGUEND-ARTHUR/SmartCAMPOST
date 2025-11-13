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
    @Column(name = "pod_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcel_id", nullable = false, unique = true)
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "courier_id")
    private Courier courier;

    @Enumerated(EnumType.STRING)
    @Column(name = "proof_type", nullable = false, length = 20)
    private DeliveryProofType proofType;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "details")
    private String details;
}
