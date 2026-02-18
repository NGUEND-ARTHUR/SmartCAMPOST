package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.AiExecutionStatus;
import com.smartcampost.backend.model.enums.AiSubjectType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Logs actual execution of AI-triggered actions.
 * Audits all AI-driven actions executed in the system.
 */
@Entity
@Table(name = "ai_execution_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiExecutionLog {

    @Id
    @Column(name = "execution_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_id")
    private AiAgentRecommendation recommendation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decision_id")
    private AiDecisionLog decision;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 30)
    private AiSubjectType targetType;

    @Column(name = "target_id", columnDefinition = "BINARY(16)")
    private UUID targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "execution_status", nullable = false, length = 20)
    private AiExecutionStatus executionStatus;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "result_summary", length = 500)
    private String resultSummary;

    @Lob
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Lob
    @Column(name = "rollback_data", columnDefinition = "JSON")
    private String rollbackData;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (startedAt == null) startedAt = Instant.now();
    }
}
