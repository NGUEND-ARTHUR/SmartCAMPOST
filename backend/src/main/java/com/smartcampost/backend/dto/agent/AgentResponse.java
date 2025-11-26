package com.smartcampost.backend.dto.agent;

import com.smartcampost.backend.model.enums.StaffStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AgentResponse {

    private UUID id;
    private String fullName;
    private String staffNumber;
    private String phone;
    private StaffStatus status;
    private UUID agencyId;
    private String agencyName;
    private Instant createdAt;
}
