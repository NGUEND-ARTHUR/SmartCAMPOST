package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.agent.AgentRequest;
import com.smartcampost.backend.dto.agent.AgentResponse;

import java.util.List;
import java.util.UUID;

public interface AgentService {

    AgentResponse createAgent(AgentRequest request);

    List<AgentResponse> listAgents();

    AgentResponse getAgent(UUID agentId);

    void changeStatus(UUID agentId, String status);
}
