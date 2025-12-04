package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.PaymentMethod;
import com.smartcampost.backend.model.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @Column(name = "payment_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parcel_id",
            nullable = false,
            referencedColumnName = "parcel_id",
            foreignKey = @ForeignKey(name = "fk_payment_parcel")
    )
    private Parcel parcel;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "XAF";

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false)
    private PaymentMethod method; // CASH, MOBILE_MONEY, CARD

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status; // PENDING, SUCCESS, FAILED, CANCELLED

    @Column(
            name = "timestamp",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant timestamp;

    @Column(name = "external_ref", length = 100)
    private String externalRef;

    // ============================================================
    // 🔥 NEW FIELD: for chargeback / reverse payment handling
    // ============================================================

    @Column(name = "reversed", nullable = false)
    @Builder.Default
    private Boolean reversed = false;

    public Boolean isReversed() {
        return reversed;
    }

    public void setReversed(Boolean reversed) {
        this.reversed = reversed;
    }

    // ============================================================
    // LIFECYCLE HOOK
    // ============================================================
    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (timestamp == null) {
            timestamp = Instant.now();
        }
        if (currency == null) {
            currency = "XAF";
        }
        if (status == null) {
            status = PaymentStatus.PENDING;
        }
        if (reversed == null) {
            reversed = false;
        }
    }
}
