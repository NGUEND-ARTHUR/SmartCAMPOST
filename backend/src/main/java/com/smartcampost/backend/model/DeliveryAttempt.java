package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.DeliveryAttemptResult;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity to track delivery attempts for a parcel.
 * Each failed or successful delivery attempt is recorded.
 */
@Entity
@Table(name = "delivery_attempt")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryAttempt {

    @Id
    @Column(name = "attempt_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parcel_id",
            nullable = false,
            referencedColumnName = "parcel_id",
            foreignKey = @ForeignKey(name = "fk_attempt_parcel")
    )
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "courier_id",
            referencedColumnName = "courier_id",
            foreignKey = @ForeignKey(name = "fk_attempt_courier")
    )
    private Courier courier;

    @Column(name = "attempt_number", nullable = false)
    private int attemptNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 20)
    private DeliveryAttemptResult result;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "attempted_at", nullable = false)
    private Instant attemptedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (attemptedAt == null) {
            attemptedAt = Instant.now();
        }
    }
}
