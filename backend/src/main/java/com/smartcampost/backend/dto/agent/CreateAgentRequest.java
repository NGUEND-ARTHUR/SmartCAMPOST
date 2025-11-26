package com.smartcampost.backend.dto.agent;

import lombok.Data;

import java.util.UUID;

@Data
public class CreateAgentRequest {

    private String fullName;
    private String staffNumber;
    private String phone;
    private String password;         // mot de passe en clair (sera hashé)
    private UUID agencyId;           // optionnel : agent peut ou non être affecté à une agence
}
