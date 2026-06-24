package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiFeedback {

    @Id
    @Column(name = "feedback_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "user_id", columnDefinition = "BINARY(16)")
    private UUID userId;

    @Column(name = "rating", length = 20)
    private String rating;

    @Lob
    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    @Lob
    @Column(name = "message_content", columnDefinition = "TEXT")
    private String messageContent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
