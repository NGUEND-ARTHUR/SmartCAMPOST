package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Authorized third-party delegate who can collect a parcel
 * on behalf of the actual recipient/sender.
 *
 * The parcel owner (client) creates a delegate entry with the
 * person's name, phone, and optional ID number. The courier/agent
 * verifies the delegate's identity at handoff.
 */
@Entity
@Table(name = "parcel_delegate")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParcelDelegate {

    @Id
    @Column(name = "delegate_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcel_id", nullable = false)
    private Parcel parcel;

    @Column(name = "delegate_name", nullable = false, length = 200)
    private String delegateName;

    @Column(name = "delegate_phone", nullable = false, length = 30)
    private String delegatePhone;

    @Column(name = "delegate_id_number", length = 50)
    private String delegateIdNumber;

    @Column(name = "relationship", length = 100)
    private String relationship;

    @Column(name = "pin_code", length = 10)
    private String pinCode;

    @Column(name = "used", nullable = false)
    @Builder.Default
    private boolean used = false;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (expiresAt == null) expiresAt = Instant.now().plusSeconds(7 * 24 * 3600);
        if (pinCode == null) pinCode = String.valueOf(1000 + (int)(Math.random() * 9000));
    }
}
