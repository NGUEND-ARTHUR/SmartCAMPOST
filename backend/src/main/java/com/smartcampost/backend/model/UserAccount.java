package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_account")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccount {

    @Id
    @Column(name = "id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "phone", nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role; // CLIENT, AGENT, STAFF, COURIER

    @Column(name = "entity_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID entityId;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant createdAt;

    // 🔥 NEW FIELD: account frozen flag (for compliance / risk)
    @Column(name = "is_frozen", nullable = false)
    private Boolean frozen = false;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();  // convert automatically to BINARY(16)
        }
        if (createdAt == null) {
            createdAt = Instant.now(); // ensures NOT NULL
        }
        if (frozen == null) {
            frozen = false;
        }
    }

    // 🔥 Explicit getter to support account.isFrozen() calls
    public Boolean isFrozen() {
        return frozen;
    }

    // Explicit setter (Lombok would generate setFrozen, but we keep it clear)
    public void setFrozen(Boolean frozen) {
        this.frozen = frozen;
    }
}
