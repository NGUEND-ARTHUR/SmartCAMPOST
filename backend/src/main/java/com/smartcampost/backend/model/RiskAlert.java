package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.RiskAlertStatus;
import com.smartcampost.backend.model.enums.RiskAlertType;
import com.smartcampost.backend.model.enums.RiskSeverity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "risk_alert")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAlert {

    @Id
    @Column(name = "risk_alert_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcel_id")
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 30)
    private RiskAlertType alertType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private RiskSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RiskAlertStatus status;

    @Column(name = "resolved", nullable = false)
    private boolean resolved;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_staff_id")
    private Staff reviewedByStaff;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = RiskAlertStatus.OPEN;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}