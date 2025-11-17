package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.agent.AgentRequest;
import com.smartcampost.backend.dto.agent.AgentResponse;
import com.smartcampost.backend.model.Agent;
import com.smartcampost.backend.model.enums.StaffStatus;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.service.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgentServiceImpl implements AgentService {

    private final AgentRepository agentRepository;

    @Override
    public AgentResponse createAgent(AgentRequest request) {
        Agent agent = Agent.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .staffNumber(request.getStaffNumber())
                .phone(request.getPhone())
                .status(StaffStatus.ACTIVE)
                .build();

        agent = agentRepository.save(agent);
        return toResponse(agent);
    }

    @Override
    public List<AgentResponse> listAgents() {
        return agentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AgentResponse getAgent(UUID agentId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + agentId));
        return toResponse(agent);
    }

    @Override
    public void changeStatus(UUID agentId, String status) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + agentId));
        StaffStatus newStatus = StaffStatus.valueOf(status.toUpperCase());
        agent.setStatus(newStatus);
        agentRepository.save(agent);
    }

    private AgentResponse toResponse(Agent agent) {
        return AgentResponse.builder()
                .id(agent.getId())
                .fullName(agent.getFullName())
                .staffNumber(agent.getStaffNumber())
                .phone(agent.getPhone())
                .status(agent.getStatus() != null ? agent.getStatus().name() : null)
                .createdAt(agent.getCreatedAt())
                .build();
    }
}
