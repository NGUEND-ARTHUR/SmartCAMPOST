package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.agent.AssignAgentAgencyRequest;
import com.smartcampost.backend.dto.agent.AgentResponse;
import com.smartcampost.backend.dto.agent.CreateAgentRequest;
import com.smartcampost.backend.dto.agent.UpdateAgentStatusRequest;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Agent;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.StaffStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AgentServiceImpl implements AgentService {

    private final AgentRepository agentRepository;
    private final AgencyRepository agencyRepository;
    private final UserAccountRepository userAccountRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ============================================================
    // CREATE AGENT
    // ============================================================
    @Override
    public AgentResponse createAgent(CreateAgentRequest request) {

        // unicité staffNumber
        if (agentRepository.existsByStaffNumber(request.getStaffNumber())) {
            throw new ConflictException(
                    "Staff number already in use",
                    ErrorCode.AGENT_STAFF_NUMBER_EXISTS
            );
        }

        // unicité phone (Agent + UserAccount)
        if (agentRepository.existsByPhone(request.getPhone())
                || userAccountRepository.existsByPhone(request.getPhone())) {
            throw new ConflictException(
                    "Phone already in use",
                    ErrorCode.AGENT_PHONE_EXISTS
            );
        }

        // récupérer l'agence si fournie
        Agency agency = null;
        if (request.getAgencyId() != null) {
            agency = agencyRepository.findById(request.getAgencyId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Agency not found",
                                    ErrorCode.AGENCY_NOT_FOUND
                            ));
        }

        // hash du mot de passe
        String encodedPassword = encoder.encode(request.getPassword());

        // créer Agent
        Agent agent = Agent.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .staffNumber(request.getStaffNumber())
                .phone(request.getPhone())
                .status(StaffStatus.ACTIVE)
                .agency(agency)
                .passwordHash(encodedPassword)
                .createdAt(Instant.now())
                .build();

        agentRepository.save(agent);

        // créer UserAccount pour login Agent
        UserAccount account = UserAccount.builder()
                .id(UUID.randomUUID())
                .phone(request.getPhone())
                .passwordHash(encodedPassword)
                .role(UserRole.AGENT)
                .entityId(agent.getId())
                .build();

        userAccountRepository.save(account);

        return toResponse(agent);
    }

    // ============================================================
    // GET BY ID
    // ============================================================
    @Override
    public AgentResponse getAgentById(UUID agentId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Agent not found",
                                ErrorCode.AGENT_NOT_FOUND
                        ));
        return toResponse(agent);
    }

    // ============================================================
    // LIST
    // ============================================================
    @Override
    public Page<AgentResponse> listAgents(int page, int size) {
        return agentRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ============================================================
    // UPDATE STATUS
    // ============================================================
    @Override
    public AgentResponse updateAgentStatus(UUID agentId, UpdateAgentStatusRequest request) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Agent not found",
                                ErrorCode.AGENT_NOT_FOUND
                        ));

        agent.setStatus(request.getStatus());
        agentRepository.save(agent);

        return toResponse(agent);
    }

    // ============================================================
    // ASSIGN / CHANGE AGENCY
    // ============================================================
    @Override
    public AgentResponse assignAgency(UUID agentId, AssignAgentAgencyRequest request) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Agent not found",
                                ErrorCode.AGENT_NOT_FOUND
                        ));

        Agency agency = null;
        if (request.getAgencyId() != null) {
            agency = agencyRepository.findById(request.getAgencyId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Agency not found",
                                    ErrorCode.AGENCY_NOT_FOUND
                            ));
        }

        agent.setAgency(agency);
        agentRepository.save(agent);

        return toResponse(agent);
    }

    // ================= HELPERS =================

    private AgentResponse toResponse(Agent agent) {
        return AgentResponse.builder()
                .id(agent.getId())
                .fullName(agent.getFullName())
                .staffNumber(agent.getStaffNumber())
                .phone(agent.getPhone())
                .status(agent.getStatus())
                .agencyId(agent.getAgency() != null ? agent.getAgency().getId() : null)
                .agencyName(agent.getAgency() != null ? agent.getAgency().getAgencyName() : null)
                .createdAt(agent.getCreatedAt())
                .build();
    }
}
