package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ServiceType;
import com.smartcampost.backend.model.enums.PaymentOption;
import com.smartcampost.backend.model.enums.QrStatus;
import com.smartcampost.backend.model.enums.LocationMode;
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

    // --------------------------------------------------
    //  Compatibility alias (spec wording): trackingNumber
    // --------------------------------------------------
    @Column(name = "tracking_number", length = 80)
    private String trackingNumber;

    // --------------------------------------------------
    //  🔥 QR Code Two-Step Logic (PARTIAL → FINAL)
    // --------------------------------------------------
    @Enumerated(EnumType.STRING)
    @Column(name = "qr_status", nullable = false, length = 20)
    @Builder.Default
    private QrStatus qrStatus = QrStatus.PARTIAL;

    @Column(name = "is_locked", nullable = false)
    @Builder.Default
    private boolean locked = false;

    @Column(name = "partial_qr_code", length = 500)
    private String partialQrCode;

    @Column(name = "final_qr_code", length = 500)
    private String finalQrCode;
    // --------------------------------------------------

    // --------------------------------------------------
    //  🔥 GPS Location at Creation
    // --------------------------------------------------
    @Column(name = "creation_latitude", columnDefinition = "DECIMAL(10,8)")
    private Double creationLatitude;

    @Column(name = "creation_longitude", columnDefinition = "DECIMAL(11,8)")
    private Double creationLongitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_mode", length = 20)
    @Builder.Default
    private LocationMode locationMode = LocationMode.GPS_DEFAULT;
    // --------------------------------------------------

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

    // --------------------------------------------------
    //  🔥 SPRINT 14 — NEW FIELDS ADDED (NO DELETIONS)
    // --------------------------------------------------

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_option", nullable = false)
    private PaymentOption paymentOption; // PREPAID, COD

    @Column(name = "photo_url", length = 255)
    private String photoUrl; // optional

    @Column(name = "description_comment", length = 1000)
    private String descriptionComment; // optional comment at validation

    // --------------------------------------------------
    //  🔥 SPRINT 15 — VALIDATION FIELDS (Agent/Courier Acceptance)
    // --------------------------------------------------

    @Column(name = "validated_weight")
    private Double validatedWeight; // Weight confirmed by agent during acceptance

    @Column(name = "validated_dimensions", length = 50)
    private String validatedDimensions; // Dimensions confirmed by agent

    @Column(name = "validation_comment", length = 1000)
    private String validationComment; // Agent's notes during acceptance

    @Column(name = "description_confirmed")
    private Boolean descriptionConfirmed; // Agent confirmed description is accurate

    @Column(name = "validated_at")
    private Instant validatedAt; // Timestamp when parcel was validated/accepted

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "validated_by_staff_id",
            referencedColumnName = "staff_id",
            foreignKey = @ForeignKey(name = "fk_parcel_validated_by")
    )
    private Staff validatedBy; // Agent/Courier who validated the parcel
    // --------------------------------------------------

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
            status = ParcelStatus.CREATED;
        }
        // Keep trackingNumber in sync for clients expecting that field name
        if (trackingNumber == null && trackingRef != null) {
            trackingNumber = trackingRef;
        }
        if (!fragile) {
            fragile = false;
        }
        if (paymentOption == null) {
            paymentOption = PaymentOption.PREPAID;
        }
        // QR Code two-step logic: starts as PARTIAL
        if (qrStatus == null) {
            qrStatus = QrStatus.PARTIAL;
        }
        // Parcel starts unlocked, locked after validation
        if (!locked) {
            locked = false;
        }
        if (locationMode == null) {
            locationMode = LocationMode.GPS_DEFAULT;
        }
    }
}
