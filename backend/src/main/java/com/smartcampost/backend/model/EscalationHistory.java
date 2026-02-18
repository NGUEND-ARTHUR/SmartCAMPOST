package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Tracks escalations of issues/alerts.
 * Records all escalations with source type (RISK_ALERT, ANOMALY, SUPPORT_TICKET, AI_DECISION)
 * and tracks from/to escalation levels.
 */
@Entity
@Table(name = "escalation_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscalationHistory {

    @Id
    @Column(name = "escalation_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "source_type", nullable = false, length = 30)
    private String sourceType;

    @Column(name = "source_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID sourceId;

    @Column(name = "from_level", nullable = false, columnDefinition = "TINYINT")
    private Integer fromLevel;

    @Column(name = "to_level", nullable = false, columnDefinition = "TINYINT")
    private Integer toLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalated_by")
    private Staff escalatedBy;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "auto_escalated", nullable = false)
    @Builder.Default
    private Boolean autoEscalated = false;

    @Column(name = "escalated_at", nullable = false)
    private Instant escalatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (escalatedAt == null) escalatedAt = Instant.now();
        if (autoEscalated == null) autoEscalated = false;
    }
}
