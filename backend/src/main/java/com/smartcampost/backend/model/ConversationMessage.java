package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.ConversationRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Individual messages in a conversation.
 */
@Entity
@Table(name = "conversation_message")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationMessage {

    @Id
    @Column(name = "message_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private ConversationRole role;

    @Lob
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "detected_intent", length = 100)
    private String detectedIntent;

    @Lob
    @Column(name = "detected_entities", columnDefinition = "JSON")
    private String detectedEntities;

    @Column(name = "action_taken", length = 100)
    private String actionTaken;

    @Lob
    @Column(name = "action_result", columnDefinition = "JSON")
    private String actionResult;

    @Column(name = "token_count")
    private Integer tokenCount;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (timestamp == null) timestamp = Instant.now();
    }
}
