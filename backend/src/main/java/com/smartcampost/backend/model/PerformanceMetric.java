package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Time-based performance indicators.
 * Stores aggregated metrics for system performance tracking.
 */
@Entity
@Table(name = "performance_metric")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceMetric {

    @Id
    @Column(name = "metric_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "metric_type", nullable = false, length = 30)
    private String metricType;

    @Column(name = "subject_type", nullable = false, length = 30)
    private String subjectType;

    @Column(name = "subject_id", columnDefinition = "BINARY(16)")
    private UUID subjectId;

    @Column(name = "period_type", nullable = false, length = 20)
    private String periodType;

    @Column(name = "period_start", nullable = false)
    private Instant periodStart;

    @Column(name = "period_end", nullable = false)
    private Instant periodEnd;

    @Column(name = "metric_value", nullable = false)
    private Float metricValue;

    @Column(name = "sample_count", nullable = false)
    @Builder.Default
    private Integer sampleCount = 1;

    @Lob
    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (sampleCount == null) sampleCount = 1;
    }
}
