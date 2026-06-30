package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * A single chat message exchanged between a parcel's client and the
 * agent/courier currently handling it (coordination, e.g. "I'm outside").
 */
@Entity
@Table(name = "parcel_message")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParcelMessage {

    @Id
    @Column(name = "message_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcel_id", nullable = false)
    private Parcel parcel;

    @Column(name = "sender_account_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID senderAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", nullable = false, length = 20)
    private UserRole senderRole;

    @Column(name = "sender_name", length = 150)
    private String senderName;

    @Lob
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Builder.Default
    @Column(name = "read_by_recipient", nullable = false)
    private boolean readByRecipient = false;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
