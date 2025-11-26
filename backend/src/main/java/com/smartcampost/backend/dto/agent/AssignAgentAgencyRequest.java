package com.smartcampost.backend.dto.agent;

import lombok.Data;

import java.util.UUID;

@Data
public class AssignAgentAgencyRequest {

    private UUID agencyId;   // peut être null si on veut détacher l’agent de son agence
}
