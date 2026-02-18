package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.AiActionStatus;
import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_agent_recommendation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAgentRecommendation {

    @Id
    @Column(name = "recommendation_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "module_type", nullable = false, length = 20)
    private AiModuleType moduleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 20)
    private AiSubjectType subjectType;

    @Column(name = "subject_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID subjectId;

    @Column(name = "summary", length = 255)
    private String summary;

    @Lob
    @Column(name = "payload_json", nullable = false, columnDefinition = "JSON")
    private String payloadJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // New fields for status tracking
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AiActionStatus status = AiActionStatus.PENDING;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Staff reviewedBy;

    @Column(name = "execution_result", length = 500)
    private String executionResult;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = AiActionStatus.PENDING;
    }
}

