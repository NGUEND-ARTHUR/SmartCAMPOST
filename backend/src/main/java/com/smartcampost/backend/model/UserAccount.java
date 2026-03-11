package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.AuthProvider;
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

    @Column(name = "phone", unique = true, length = 20)
    private String phone;

    @Column(name = "email", unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "auth_provider", nullable = false, length = 20)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(name = "google_id", unique = true, length = 255)
    private String googleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role; // CLIENT, AGENT, STAFF, COURIER, ADMIN, FINANCE, RISK

    @Column(name = "entity_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID entityId;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant createdAt;

    // NEW FIELD: account frozen flag (for compliance / risk)
    // ✅ DB column name is "frozen" (NOT "is_frozen")
    @Builder.Default
    @Column(name = "frozen", nullable = false)
    private Boolean frozen = false;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();  // stored as BINARY(16)
        }
        if (createdAt == null) {
            createdAt = Instant.now(); // ensures NOT NULL
        }
        if (frozen == null) {
            frozen = false;
        }
    }

    // Explicit getter to support account.isFrozen() calls
    public Boolean isFrozen() {
        return frozen;
    }

    // Explicit setter (keep naming clear)
    public void setFrozen(Boolean frozen) {
        this.frozen = frozen;
    }
}
