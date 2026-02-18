package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.EventCategory;
import com.smartcampost.backend.model.enums.EventProcessingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Unified events table for event-driven architecture.
 */
@Entity
@Table(name = "system_event")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemEvent {

    @Id
    @Column(name = "event_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_category", nullable = false, length = 30)
    private EventCategory eventCategory;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", columnDefinition = "BINARY(16)")
    private UUID entityId;

    @Lob
    @Column(name = "payload", nullable = false, columnDefinition = "JSON")
    private String payload;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 5;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false, length = 20)
    @Builder.Default
    private EventProcessingStatus processingStatus = EventProcessingStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "processor_id", length = 100)
    private String processorId;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @Lob
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (priority == null) priority = 5;
        if (processingStatus == null) processingStatus = EventProcessingStatus.PENDING;
        if (retryCount == null) retryCount = 0;
    }
}
