package com.smartcampost.backend.dto.agent;

import com.smartcampost.backend.model.enums.StaffStatus;
import lombok.Data;

@Data
public class UpdateAgentStatusRequest {
    private StaffStatus status;   // ACTIVE / INACTIVE / SUSPENDED
}
