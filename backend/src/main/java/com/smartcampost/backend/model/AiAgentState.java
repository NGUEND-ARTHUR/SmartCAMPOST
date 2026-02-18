package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Tracks the state and confidence of each AI agent instance.
 */
@Entity
@Table(name = "ai_agent_state",
       uniqueConstraints = @UniqueConstraint(columnNames = {"module_type", "subject_type", "subject_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAgentState {

    @Id
    @Column(name = "agent_state_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "module_type", nullable = false, length = 20)
    private AiModuleType moduleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 20)
    private AiSubjectType subjectType;

    @Column(name = "subject_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID subjectId;

    @Column(name = "confidence_score", nullable = false)
    @Builder.Default
    private Float confidenceScore = 0.5f;

    @Column(name = "risk_score")
    private Float riskScore;

    @Lob
    @Column(name = "state_data", columnDefinition = "JSON")
    private String stateData;

    @Column(name = "last_evaluation_at")
    private Instant lastEvaluationAt;

    @Column(name = "evaluation_count", nullable = false)
    @Builder.Default
    private Integer evaluationCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (confidenceScore == null) confidenceScore = 0.5f;
        if (evaluationCount == null) evaluationCount = 0;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
