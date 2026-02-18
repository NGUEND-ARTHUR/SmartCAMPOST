package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Stores prediction results (ETA, risk, congestion, etc.).
 * Used for storing AI model predictions with confidence scores.
 */
@Entity
@Table(name = "predictive_result")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictiveResult {

    @Id
    @Column(name = "prediction_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "prediction_type", nullable = false, length = 30)
    private String predictionType;

    @Column(name = "subject_type", nullable = false, length = 30)
    private String subjectType;

    @Column(name = "subject_id", columnDefinition = "BINARY(16)")
    private UUID subjectId;

    @Column(name = "predicted_value")
    private Float predictedValue;

    @Column(name = "predicted_timestamp")
    private Instant predictedTimestamp;

    @Column(name = "confidence_score", nullable = false)
    @Builder.Default
    private Float confidenceScore = 0.5f;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @Lob
    @Column(name = "input_features", columnDefinition = "JSON")
    private String inputFeatures;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "valid_until")
    private Instant validUntil;

    @Column(name = "actual_value")
    private Float actualValue;

    @Column(name = "actual_timestamp")
    private Instant actualTimestamp;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (confidenceScore == null) confidenceScore = 0.5f;
    }
}
