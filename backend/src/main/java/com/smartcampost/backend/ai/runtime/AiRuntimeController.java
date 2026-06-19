package com.smartcampost.backend.ai.runtime;

import com.smartcampost.backend.dto.ai.ChatRequest;
import com.smartcampost.backend.dto.ai.ChatResponse;
import com.smartcampost.backend.service.DynamicPermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.Instant;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai/runtime")
@RequiredArgsConstructor
public class AiRuntimeController {

    private final AiRuntimeService aiRuntimeService;
    private final DynamicPermissionService dynamicPermissionService;
    private final ProjectAutomationDiscoveryService projectAutomationDiscoveryService;

    @PostMapping("/reactive/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(aiRuntimeService.answer(request));
    }

    @PostMapping("/tools/execute")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiToolResult> executeTool(@Valid @RequestBody AiToolRequest request) {
        AiToolRequest enriched = enrichRequest(request);
        return ResponseEntity.ok(aiRuntimeService.executeTool(enriched));
    }

    @PostMapping("/proactive/events")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiRuntimeOutcome> processEvent(@Valid @RequestBody OperationalEventRequest request) {
        OperationalEventRequest enriched = new OperationalEventRequest(
                request.eventType(),
                request.source(),
                request.entityType(),
                request.entityId(),
                request.actor() != null ? request.actor() : currentActorContext(),
                request.payload(),
                request.correlationId(),
                request.occurredAt() != null ? request.occurredAt() : Instant.now()
        );
        return ResponseEntity.ok(aiRuntimeService.processEvent(enriched));
    }

    @GetMapping("/tools")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<java.util.List<AiToolDescriptor>> listTools() {
        return ResponseEntity.ok(aiRuntimeService.listTools());
    }

    @GetMapping("/discovery/automation-opportunities")
    @PreAuthorize("hasAuthority('ai:discover') or hasRole('ADMIN')")
    public ResponseEntity<AutomationDiscoveryReport> discoverAutomationOpportunities() {
        return ResponseEntity.ok(projectAutomationDiscoveryService.discover());
    }

    private AiToolRequest enrichRequest(AiToolRequest request) {
        return new AiToolRequest(
                request.mode(),
                request.toolName(),
                request.actor() != null ? request.actor() : currentActorContext(),
                request.parameters(),
                request.ownershipVerified(),
                request.approvalGranted(),
                request.approvalReference(),
                request.correlationId(),
                request.sourceEventType(),
                request.requestedAt() != null ? request.requestedAt() : Instant.now()
        );
    }

    private AiActorContext currentActorContext() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return new AiActorContext(null, "anonymous", "ANONYMOUS", Set.of());
        }

        UUID actorId = null;
        try {
            actorId = UUID.fromString(authentication.getName());
        } catch (Exception ignored) {
            actorId = null;
        }

        Set<String> permissions = authentication.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority())
                .collect(Collectors.toSet());

        String role = authentication.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority().replaceFirst("^ROLE_", ""))
                .findFirst()
                .orElse("UNKNOWN");

        permissions.addAll(dynamicPermissionService.permissionsForRole(role));

        return new AiActorContext(actorId, authentication.getName(), role, permissions);
    }
}
