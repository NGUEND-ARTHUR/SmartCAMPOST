package com.smartcampost.backend.model;
import com.smartcampost.backend.model.enums.RiskSeverity;
import com.smartcampost.backend.model.enums.RiskType;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private RiskType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private RiskSeverity severity;

    @Column(name = "entity_type", length = 50)
    private String entityType; // "PARCEL", "PAYMENT", "CLIENT"

    @Column(name = "entity_id", length = 100)
    private String entityId;   // store UUID as String for flexibility

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved", nullable = false)
    private boolean resolved;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}