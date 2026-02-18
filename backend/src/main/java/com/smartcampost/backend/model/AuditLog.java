package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.ActorType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Comprehensive audit trail (who/what/when).
 */
@Entity
@Table(name = "audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @Column(name = "audit_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", columnDefinition = "BINARY(16)")
    private UUID entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, length = 20)
    private ActorType actorType;

    @Column(name = "actor_id", length = 64)
    private String actorId;

    @Column(name = "actor_ip", length = 45)
    private String actorIp;

    @Column(name = "actor_user_agent", length = 255)
    private String actorUserAgent;

    @Lob
    @Column(name = "old_values", columnDefinition = "JSON")
    private String oldValues;

    @Lob
    @Column(name = "new_values", columnDefinition = "JSON")
    private String newValues;

    @Column(name = "change_summary", length = 500)
    private String changeSummary;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "request_id", length = 100)
    private String requestId;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (timestamp == null) timestamp = Instant.now();
    }
}
