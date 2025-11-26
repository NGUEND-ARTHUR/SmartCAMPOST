package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.agent.*;
import com.smartcampost.backend.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    // US10 : créer un agent
    @PostMapping
    public ResponseEntity<AgentResponse> createAgent(
            @Valid @RequestBody CreateAgentRequest request
    ) {
        return ResponseEntity.ok(agentService.createAgent(request));
    }

    // détail d’un agent
    @GetMapping("/{agentId}")
    public ResponseEntity<AgentResponse> getAgent(@PathVariable UUID agentId) {
        return ResponseEntity.ok(agentService.getAgentById(agentId));
    }

    // US11/US12 : liste des agents (admin)
    @GetMapping
    public ResponseEntity<Page<AgentResponse>> listAgents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(agentService.listAgents(page, size));
    }

    // US12 : activer / désactiver / suspendre
    @PatchMapping("/{agentId}/status")
    public ResponseEntity<AgentResponse> updateStatus(
            @PathVariable UUID agentId,
            @Valid @RequestBody UpdateAgentStatusRequest request
    ) {
        return ResponseEntity.ok(agentService.updateAgentStatus(agentId, request));
    }

    // US11 : assigner une agence
    @PatchMapping("/{agentId}/agency")
    public ResponseEntity<AgentResponse> assignAgency(
            @PathVariable UUID agentId,
            @Valid @RequestBody AssignAgentAgencyRequest request
    ) {
        return ResponseEntity.ok(agentService.assignAgency(agentId, request));
    }
}
