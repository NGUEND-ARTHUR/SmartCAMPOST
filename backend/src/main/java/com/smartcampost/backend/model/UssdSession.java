package com.smartcampost.backend.model;
import com.smartcampost.backend.model.enums.UssdSessionState;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ussd_session")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UssdSession {

    @Id
    @Column(name = "session_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "msisdn", nullable = false, length = 20)
    private String msisdn; // phone number

    @Column(name = "session_ref", nullable = false, length = 100)
    private String sessionRef; // ID from USSD switch

    @Column(name = "current_menu", length = 100)
    private String currentMenu;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 20)
    private UssdSessionState state;

    @Column(name = "last_interaction_at", nullable = false)
    private Instant lastInteractionAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (lastInteractionAt == null) lastInteractionAt = Instant.now();
        if (state == null) state = UssdSessionState.ACTIVE;
    }
}