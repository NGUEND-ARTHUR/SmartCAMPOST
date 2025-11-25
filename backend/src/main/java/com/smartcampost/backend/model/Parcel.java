package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ServiceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "parcel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parcel {

    @Id
    @Column(name = "parcel_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "tracking_ref", nullable = false, length = 80, unique = true)
    private String trackingRef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "client_id",
            nullable = false,
            referencedColumnName = "client_id",
            foreignKey = @ForeignKey(name = "fk_parcel_client")
    )
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "sender_address_id",
            nullable = false,
            referencedColumnName = "address_id",
            foreignKey = @ForeignKey(name = "fk_parcel_sender_addr")
    )
    private Address senderAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "recipient_address_id",
            nullable = false,
            referencedColumnName = "address_id",
            foreignKey = @ForeignKey(name = "fk_parcel_recipient_addr")
    )
    private Address recipientAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "origin_agency_id",
            referencedColumnName = "agency_id",
            foreignKey = @ForeignKey(name = "fk_parcel_origin_agency")
    )
    private Agency originAgency; // nullable

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "destination_agency_id",
            referencedColumnName = "agency_id",
            foreignKey = @ForeignKey(name = "fk_parcel_dest_agency")
    )
    private Agency destinationAgency; // nullable

    @Column(name = "weight", nullable = false)
    private Double weight; // FLOAT en DB → Double ici

    @Column(name = "dimensions", length = 50)
    private String dimensions;

    @Column(name = "declared_value")
    private Double declaredValue; // FLOAT en DB

    @Column(name = "is_fragile", nullable = false)
    private boolean fragile;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false)
    private ServiceType serviceType; // STANDARD, EXPRESS

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_option", nullable = false)
    private DeliveryOption deliveryOption; // AGENCY, HOME

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ParcelStatus status; // CREATED,...,CANCELLED

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant createdAt;

    @Column(name = "expected_delivery_at")
    private Instant expectedDeliveryAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = ParcelStatus.CREATED; // match default SQL
        }
        if (!fragile) {
            fragile = false; // default SQL
        }
    }
}
