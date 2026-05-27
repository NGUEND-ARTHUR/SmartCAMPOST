package com.smartcampost.backend.approval;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approval_requests")
@Data
@NoArgsConstructor
public class ApprovalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private String toolName;

    private String actorId;

    private String actorRole;

    @Lob
    private String parametersJson;

    private String reason;

    private boolean approved;

    private boolean processed;

    private boolean handled;

    private Instant createdAt = Instant.now();

    private Instant processedAt;

}
