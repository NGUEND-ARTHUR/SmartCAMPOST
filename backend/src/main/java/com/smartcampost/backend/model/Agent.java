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
    @Column(name = "agent_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id")
    private Agency agency;   // nullable

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false, unique = true)
    private Staff staff;

    @Column(name = "staff_number", nullable = false, length = 50, unique = true)
    private String staffNumber;

    @Column(name = "phone", nullable = false, length = 30, unique = true)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StaffStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;


}
