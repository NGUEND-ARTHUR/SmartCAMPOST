package com.smartcampost.backend.dto.agent;

import lombok.Data;

@Data
public class AgentRequest {
    private String fullName;
    private String staffNumber;
    private String phone;
    private String status;   // "Active", "Inactive", "Suspended"
}
