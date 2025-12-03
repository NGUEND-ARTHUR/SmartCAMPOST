package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "delivery_otp")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryOtp {

    @Id
    @Column(name = "otp_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    // We keep this as simple foreign key by ID (not relation), like you wrote
    @Column(name = "parcel_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID parcelId;

    @Column(name = "phone_number", nullable = false, length = 30)
    private String phoneNumber;

    @Column(name = "otp_code", nullable = false, length = 10)
    private String otpCode;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "consumed", nullable = false)
    private boolean consumed;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID(); // BINARY(16)
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        // make sure not null
        if (!consumed) {
            consumed = false;
        }
    }
}
