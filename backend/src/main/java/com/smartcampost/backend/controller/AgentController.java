package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.agent.AgentRequest;
import com.smartcampost.backend.dto.agent.AgentResponse;
import com.smartcampost.backend.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @PostMapping
    public ResponseEntity<AgentResponse> create(@Valid @RequestBody AgentRequest request) {
        return ResponseEntity.ok(agentService.createAgent(request));
    }

    @GetMapping
    public ResponseEntity<List<AgentResponse>> list() {
        return ResponseEntity.ok(agentService.listAgents());
    }

    @GetMapping("/{agentId}")
    public ResponseEntity<AgentResponse> get(@PathVariable UUID agentId) {
        return ResponseEntity.ok(agentService.getAgent(agentId));
    }

    @PostMapping("/{agentId}/status")
    public ResponseEntity<Void> changeStatus(@PathVariable UUID agentId,
                                             @RequestParam String status) {
        agentService.changeStatus(agentId, status);
        return ResponseEntity.ok().build();
    }
}
