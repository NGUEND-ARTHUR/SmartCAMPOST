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
import com.smartcampost.backend.model.Staff;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.StaffStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.StaffRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.springframework.lang.NonNull;

@Service
@RequiredArgsConstructor
public class AgentServiceImpl implements AgentService {

    private final AgentRepository agentRepository;
    private final AgencyRepository agencyRepository;
    private final StaffRepository staffRepository;
    private final UserAccountRepository userAccountRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ============================================================
    // CREATE AGENT
    // ============================================================
    @Override
        public AgentResponse createAgent(@NonNull CreateAgentRequest request) {
                Objects.requireNonNull(request, "request is required");

        // Générer staffNumber si non fourni
        String staffNumber = request.getStaffNumber();
        if (staffNumber == null || staffNumber.isBlank()) {
            staffNumber = "AGT-" + System.currentTimeMillis();
        }

        // Pré-calculer les conflits
        boolean staffNumberExists = agentRepository.existsByStaffNumber(staffNumber);
        boolean phoneExists = agentRepository.existsByPhone(request.getPhone())
                || userAccountRepository.existsByPhone(request.getPhone());

        // 🔥 Cas combiné : conflit global agent (staff + phone)
        if (staffNumberExists && phoneExists) {
            throw new ConflictException(
                    "Agent conflict: staff number and phone already in use",
                    ErrorCode.AGENT_CONFLICT
            );
        }

        // unicité staffNumber
        if (staffNumberExists) {
            throw new ConflictException(
                    "Staff number already in use",
                    ErrorCode.AGENT_STAFF_NUMBER_EXISTS
            );
        }

        // unicité phone (Agent + UserAccount)
        if (phoneExists) {
            throw new ConflictException(
                    "Phone already in use",
                    ErrorCode.AGENT_PHONE_EXISTS
            );
        }

        // récupérer l'agence si fournie
        Agency agency = null;
        UUID requestedAgencyId = request.getAgencyId();
        if (requestedAgencyId != null) {
            UUID agencyId = Objects.requireNonNull(requestedAgencyId, "agencyId is required");
            agency = Objects.requireNonNull(
                    agencyRepository.findById(agencyId)
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Agency not found",
                                    ErrorCode.AGENCY_NOT_FOUND
                            )),
                    "agency is required"
            );
        }

        // hash du mot de passe
        String encodedPassword = encoder.encode(request.getPassword());

        // chercher Staff existant ou en créer un nouveau
                var staffOptional = staffRepository.findByPhone(request.getPhone());
                Staff staff = staffOptional.orElse(null);
                if (staff == null) {
                        Staff newStaff = Staff.builder()
                                        .id(UUID.randomUUID())
                                        .fullName(request.getFullName())
                                        .phone(request.getPhone())
                                        .role(UserRole.AGENT.name())
                                        .passwordHash(encodedPassword)
                                        .status(StaffStatus.ACTIVE)
                                        .hiredAt(java.time.LocalDate.now())
                                        .build();
                        Staff savedStaff = staffRepository.save(newStaff);
                        if (savedStaff == null) throw new IllegalStateException("failed to save staff");
                        staff = savedStaff;
                }

        // créer Agent
        Agent agent = Agent.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .staffNumber(staffNumber)
                .phone(request.getPhone())
                .status(StaffStatus.ACTIVE)
                .agency(agency)
                .staff(staff)
                .passwordHash(encodedPassword)
                .createdAt(Instant.now())
                .build();

        Agent savedAgent = Objects.requireNonNull(agentRepository.save(agent), "failed to save agent");

        // créer UserAccount pour login Agent
        UserAccount account = UserAccount.builder()
                .id(UUID.randomUUID())
                .phone(request.getPhone())
                .passwordHash(encodedPassword)
                .role(UserRole.AGENT)
                .entityId(savedAgent.getId())
                .build();
        account = Objects.requireNonNull(userAccountRepository.save(account), "failed to save account");

        return toResponse(savedAgent);
    }

    // ============================================================
    // GET BY ID
    // ============================================================
    @Override
    public AgentResponse getAgentById(UUID agentId) {
        Objects.requireNonNull(agentId, "agentId is required");
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
        Objects.requireNonNull(agentId, "agentId is required");
        Objects.requireNonNull(request, "request is required");
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Agent not found",
                                ErrorCode.AGENT_NOT_FOUND
                        ));

        agent.setStatus(request.getStatus());
        Agent saved = Objects.requireNonNull(agentRepository.save(agent), "failed to save agent");

        return toResponse(saved);
    }

    // ============================================================
    // ASSIGN / CHANGE AGENCY
    // ============================================================
    @Override
    public AgentResponse assignAgency(UUID agentId, AssignAgentAgencyRequest request) {
        Objects.requireNonNull(agentId, "agentId is required");
        Objects.requireNonNull(request, "request is required");
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Agent not found",
                                ErrorCode.AGENT_NOT_FOUND
                        ));

        Agency agency = null;
        if (request.getAgencyId() != null) {
            UUID reqAgencyId = Objects.requireNonNull(request.getAgencyId(), "agencyId is required");
            agency = Objects.requireNonNull(
                    agencyRepository.findById(reqAgencyId)
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Agency not found",
                                    ErrorCode.AGENCY_NOT_FOUND
                            )),
                    "agency is required"
            );
        }

                agent.setAgency(agency);
                Agent saved = Objects.requireNonNull(agentRepository.save(agent), "failed to save agent");

                return toResponse(saved);
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
