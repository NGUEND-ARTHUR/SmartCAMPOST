package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.StaffStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agent {

    @Id
    @Column(name = "agent_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "agency_id",
            referencedColumnName = "agency_id",
            foreignKey = @ForeignKey(name = "fk_agent_agency")
    )
    private Agency agency; // nullable

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "staff_id",
            referencedColumnName = "staff_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_agent_staff")
    )
    private Staff staff; // NOT NULL + UNIQUE

    @Column(name = "staff_number", nullable = false, length = 50, unique = true)
    private String staffNumber;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone", nullable = false, length = 30, unique = true)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StaffStatus status; // ACTIVE, INACTIVE, SUSPENDED

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        // created_at handled by DB, do not override if null
    }
}
