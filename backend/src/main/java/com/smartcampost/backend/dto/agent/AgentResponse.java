package com.smartcampost.backend.dto.agent;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AgentResponse {
    private UUID agentId;
    private String fullName;
    private String staffNumber;
    private String phone;
    private String status;
    private Instant createdAt;
}
