package com.smartcampost.backend.model;

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
    @Column(name = "parcel_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(name = "tracking_ref", nullable = false, length = 80, unique = true)
    private String trackingRef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_address_id", nullable = false)
    private Address senderAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_address_id", nullable = false)
    private Address recipientAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origin_agency_id")
    private Agency originAgency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_agency_id")
    private Agency destinationAgency;

    @Column(name = "weight", nullable = false)
    private Double weight;

    @Column(name = "dimensions", length = 50)
    private String dimensions;

    @Column(name = "declared_value")
    private Double declaredValue;

    @Column(name = "is_fragile", nullable = false)
    private boolean fragile;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 20)
    private ServiceType serviceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_option", nullable = false, length = 20)
    private DeliveryOption deliveryOption;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ParcelStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expected_delivery_at")
    private Instant expectedDeliveryAt;

    // small inner enum just for AGENGY/HOME
    public enum DeliveryOption {
        AGENCY,
        HOME
    }
}
