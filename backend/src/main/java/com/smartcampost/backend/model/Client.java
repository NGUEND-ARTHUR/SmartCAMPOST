package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "client")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @Column(name = "client_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone", nullable = false, length = 30, unique = true)
    private String phone;

    @Column(name = "email", length = 100, unique = true)
    private String email; // nullable en DB → OK sans nullable=false

    @Column(name = "preferred_language", length = 10)
    private String preferredLanguage;

    // 🔐 mot de passe hashé pour login Client
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();      // correspond à BINARY(16)
        }
        if (createdAt == null) {
            createdAt = Instant.now();   // NOT NULL, cohérent avec le DEFAULT SQL
        }
    }
}
