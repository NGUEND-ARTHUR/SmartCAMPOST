package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.StaffStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    @Id
    @Column(name = "staff_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "role", nullable = false, length = 80)
    private String role;

    @Column(name = "email", length = 100, unique = true)
    private String email; // nullable en DB

    @Column(name = "phone", length = 30, unique = true)
    private String phone; // nullable en DB

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StaffStatus status; // ACTIVE, INACTIVE, SUSPENDED

    @Column(name = "hired_at")
    private LocalDate hiredAt;

    @Column(name = "terminated_at")
    private LocalDate terminatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (status == null) {
            status = StaffStatus.ACTIVE; // correspond au DEFAULT SQL
        }
    }
}
