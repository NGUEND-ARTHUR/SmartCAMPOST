package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Maps detected intents to system actions.
 * Defines the mapping between user intents and automated system actions.
 */
@Entity
@Table(name = "intent_action_mapping")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntentActionMapping {

    @Id
    @Column(name = "mapping_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "intent_name", nullable = false, length = 100)
    private String intentName;

    @Column(name = "action_name", nullable = false, length = 100)
    private String actionName;

    @Lob
    @Column(name = "required_entities", columnDefinition = "JSON")
    private String requiredEntities;

    @Lob
    @Column(name = "response_template", columnDefinition = "TEXT")
    private String responseTemplate;

    @Column(name = "is_automated", nullable = false)
    @Builder.Default
    private Boolean isAutomated = true;

    @Column(name = "requires_confirmation", nullable = false)
    @Builder.Default
    private Boolean requiresConfirmation = false;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (isAutomated == null) isAutomated = true;
        if (requiresConfirmation == null) requiresConfirmation = false;
        if (active == null) active = true;
    }
}
