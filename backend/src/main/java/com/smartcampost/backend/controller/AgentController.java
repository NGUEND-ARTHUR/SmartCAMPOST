package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.agent.*;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;
    private final ParcelRepository parcelRepository;

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
        List<Parcel> pendingParcels = parcelRepository.findByStatusIn(
                List.of(ParcelStatus.CREATED, ParcelStatus.ACCEPTED, ParcelStatus.ARRIVED_DEST_AGENCY)
        );
        List<Map<String, Object>> tasks = pendingParcels.stream()
                .limit(50)
                .map(this::parcelToTask)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('AGENT','STAFF','ADMIN')")
    public ResponseEntity<Map<String, Object>> getTask(@PathVariable String taskId) {
        UUID id = UUID.fromString(taskId);
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new com.smartcampost.backend.exception.ResourceNotFoundException(
                        "Parcel not found", com.smartcampost.backend.exception.ErrorCode.PARCEL_NOT_FOUND));
        return ResponseEntity.ok(parcelToTask(parcel));
    }

    private Map<String, Object> parcelToTask(Parcel parcel) {
        Map<String, Object> task = new LinkedHashMap<>();
        task.put("id", parcel.getId().toString());
        task.put("type", parcel.getStatus() == ParcelStatus.CREATED ? "INTAKE" : "PROCESS");
        task.put("parcelId", parcel.getId().toString());
        task.put("trackingRef", parcel.getTrackingRef());
        task.put("status", parcel.getStatus().name());
        task.put("location", parcel.getOriginAgency() != null ? parcel.getOriginAgency().getAgencyName() : "—");
        task.put("createdAt", parcel.getCreatedAt());
        return task;
    }
}
