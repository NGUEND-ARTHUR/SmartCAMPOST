package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.AnomalyStatus;
import com.smartcampost.backend.model.enums.AnomalySubjectType;
import com.smartcampost.backend.model.enums.AnomalyType;
import com.smartcampost.backend.model.enums.RiskSeverity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Detected anomalies and escalation tracking.
 * Stores all detected anomalies in the system with escalation levels.
 */
@Entity
@Table(name = "anomaly_event")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnomalyEvent {

    @Id
    @Column(name = "anomaly_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "anomaly_type", nullable = false, length = 30)
    private AnomalyType anomalyType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private RiskSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 20)
    private AnomalySubjectType subjectType;

    @Column(name = "subject_id", columnDefinition = "BINARY(16)")
    private UUID subjectId;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "detection_method", length = 100)
    private String detectionMethod;

    @Lob
    @Column(name = "raw_data", columnDefinition = "JSON")
    private String rawData;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AnomalyStatus status = AnomalyStatus.DETECTED;

    @Column(name = "escalation_level", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer escalationLevel = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acknowledged_by")
    private Staff acknowledgedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private Staff resolvedBy;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = AnomalyStatus.DETECTED;
        if (escalationLevel == null) escalationLevel = 0;
    }
}
