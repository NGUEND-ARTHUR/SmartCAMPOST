package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Event subscribers for event-driven processing.
 * Stores subscriptions to system events for internal and external consumers.
 */
@Entity
@Table(name = "event_subscription")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSubscription {

    @Id
    @Column(name = "subscription_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "subscriber_name", nullable = false, unique = true, length = 100)
    private String subscriberName;

    @Column(name = "event_category", nullable = false, length = 50)
    private String eventCategory;

    @Column(name = "event_type_filter", length = 255)
    private String eventTypeFilter;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "endpoint_url", length = 500)
    private String endpointUrl;

    @Column(name = "handler_class", length = 255)
    private String handlerClass;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (active == null) active = true;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
