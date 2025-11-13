package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Agent;

import java.util.List;
import java.util.UUID;

public interface AgentService {

    Agent registerAgent(Agent agent);

    Agent getAgent(UUID agentId);

    List<Agent> listAgentsByAgency(UUID agencyId);
}
