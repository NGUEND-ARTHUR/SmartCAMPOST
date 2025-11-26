package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.agent.*;

import org.springframework.data.domain.Page;

import java.util.UUID;

public interface AgentService {

    AgentResponse createAgent(CreateAgentRequest request);

    AgentResponse getAgentById(UUID agentId);

    Page<AgentResponse> listAgents(int page, int size);

    AgentResponse updateAgentStatus(UUID agentId, UpdateAgentStatusRequest request);

    AgentResponse assignAgency(UUID agentId, AssignAgentAgencyRequest request);
}
