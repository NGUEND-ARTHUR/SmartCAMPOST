package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.agent.*;
import com.smartcampost.backend.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    // US10 : créer un agent (ADMIN only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
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

    // US12 : activer / désactiver / suspendre (ADMIN or STAFF)
    @PatchMapping("/{agentId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<AgentResponse> updateStatus(
            @PathVariable UUID agentId,
            @Valid @RequestBody UpdateAgentStatusRequest request
    ) {
        return ResponseEntity.ok(agentService.updateAgentStatus(agentId, request));
    }

    // US11 : assigner une agence (ADMIN or STAFF)
    @PatchMapping("/{agentId}/agency")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<AgentResponse> assignAgency(
            @PathVariable UUID agentId,
            @Valid @RequestBody AssignAgentAgencyRequest request
    ) {
        return ResponseEntity.ok(agentService.assignAgency(agentId, request));
    }

    @GetMapping("/me/tasks")
    @PreAuthorize("hasAnyRole('AGENT','STAFF','ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> myTasks() {
        return ResponseEntity.ok(defaultTasks());
    }

    @GetMapping("/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('AGENT','STAFF','ADMIN')")
    public ResponseEntity<Map<String, Object>> getTask(@PathVariable String taskId) {
        return ResponseEntity.ok(defaultTask(taskId, "PENDING"));
    }

    @PatchMapping("/tasks/{taskId}/status")
    @PreAuthorize("hasAnyRole('AGENT','STAFF','ADMIN')")
    public ResponseEntity<Map<String, Object>> updateTaskStatus(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> request
    ) {
        return ResponseEntity.ok(defaultTask(taskId, String.valueOf(request.getOrDefault("status", "IN_PROGRESS"))));
    }

    @PostMapping("/tasks/{taskId}/accept")
    @PreAuthorize("hasAnyRole('AGENT','STAFF','ADMIN')")
    public ResponseEntity<Map<String, Object>> acceptTask(@PathVariable String taskId) {
        return ResponseEntity.ok(defaultTask(taskId, "IN_PROGRESS"));
    }

    @PostMapping("/tasks/{taskId}/complete")
    @PreAuthorize("hasAnyRole('AGENT','STAFF','ADMIN')")
    public ResponseEntity<Map<String, Object>> completeTask(@PathVariable String taskId) {
        return ResponseEntity.ok(defaultTask(taskId, "DONE"));
    }

    private List<Map<String, Object>> defaultTasks() {
        return List.of(
                defaultTask("PICKUP-TODAY", "PENDING"),
                defaultTask("SCAN-INTAKE", "PENDING")
        );
    }

    private Map<String, Object> defaultTask(String id, String status) {
        return Map.of(
                "id", id,
                "type", id.toUpperCase().contains("SCAN") ? "SCAN" : "PICKUP",
                "parcelId", "",
                "location", "Assigned agency",
                "scheduledAt", Instant.now(),
                "status", status
        );
    }
}
