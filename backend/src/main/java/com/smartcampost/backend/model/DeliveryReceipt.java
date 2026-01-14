package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity to store delivery receipts.
 * A receipt is generated when a parcel is successfully delivered.
 */
@Entity
@Table(name = "delivery_receipt")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryReceipt {

    @Id
    @Column(name = "receipt_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parcel_id",
            nullable = false,
            unique = true,
            referencedColumnName = "parcel_id",
            foreignKey = @ForeignKey(name = "fk_receipt_parcel")
    )
    private Parcel parcel;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "proof_id",
            referencedColumnName = "pod_id",
            foreignKey = @ForeignKey(name = "fk_receipt_proof")
    )
    private DeliveryProof proof;

    @Column(name = "receipt_number", nullable = false, length = 50, unique = true)
    private String receiptNumber;

    @Column(name = "receiver_name", length = 100)
    private String receiverName;

    @Column(name = "receiver_signature_url", length = 255)
    private String receiverSignatureUrl;

    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @Column(name = "courier_name", length = 100)
    private String courierName;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "payment_collected")
    private boolean paymentCollected;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "pdf_url", length = 255)
    private String pdfUrl;

    @Column(name = "delivered_at", nullable = false)
    private Instant deliveredAt;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (generatedAt == null) {
            generatedAt = Instant.now();
        }
    }
}
