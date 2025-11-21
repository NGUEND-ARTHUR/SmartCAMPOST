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
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(unique = true, nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = false, columnDefinition = "CHAR(36)")
    private UUID entityId; // Reference to Client, Agent, Courier, or Staff

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
