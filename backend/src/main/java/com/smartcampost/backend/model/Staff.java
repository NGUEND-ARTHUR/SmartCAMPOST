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
    @Column(name = "staff_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "role", nullable = false, length = 80)
    private String role;

    @Column(name = "email", length = 100, unique = true)
    private String email;

    @Column(name = "phone", length = 30, unique = true)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StaffStatus status;

    @Column(name = "hired_at")
    private LocalDate hiredAt;

    @Column(name = "terminated_at")
    private LocalDate terminatedAt;
}
