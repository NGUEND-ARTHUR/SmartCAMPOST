package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Audit trail of AI agent decisions.
 */
@Entity
@Table(name = "ai_decision_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiDecisionLog {

    @Id
    @Column(name = "decision_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "module_type", nullable = false, length = 20)
    private AiModuleType moduleType;

    @Column(name = "decision_type", nullable = false, length = 100)
    private String decisionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 20)
    private AiSubjectType subjectType;

    @Column(name = "subject_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID subjectId;

    @Lob
    @Column(name = "input_data", columnDefinition = "JSON")
    private String inputData;

    @Column(name = "decision_outcome", nullable = false, length = 50)
    private String decisionOutcome;

    @Column(name = "confidence_score", nullable = false)
    private Float confidenceScore;

    @Lob
    @Column(name = "reasoning")
    private String reasoning;

    @Column(name = "was_overridden", nullable = false)
    @Builder.Default
    private Boolean wasOverridden = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "overridden_by")
    private Staff overriddenBy;

    @Column(name = "override_reason", length = 500)
    private String overrideReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (wasOverridden == null) wasOverridden = false;
    }
}
