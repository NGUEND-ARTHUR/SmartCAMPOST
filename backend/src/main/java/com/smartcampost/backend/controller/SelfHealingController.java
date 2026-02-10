package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.ai.CongestionAlert;
import com.smartcampost.backend.dto.ai.RouteOptimization;
import com.smartcampost.backend.dto.ai.SelfHealingAction;
import com.smartcampost.backend.service.SelfHealingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for self-healing logistics system.
 * Admin/Staff access for monitoring and interventions.
 */
@RestController
@RequestMapping("/api/self-healing")
@RequiredArgsConstructor
public class SelfHealingController {

    private final SelfHealingService selfHealingService;

    /**
     * Detect congestion across all agencies.
     */
    @GetMapping("/congestion")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<CongestionAlert>> detectCongestion() {
        return ResponseEntity.ok(selfHealingService.detectCongestion());
    }

    /**
     * Detect congestion for a specific agency.
     */
    @GetMapping("/congestion/agency/{agencyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<CongestionAlert> detectCongestionForAgency(
            @PathVariable UUID agencyId
    ) {
        return ResponseEntity.ok(selfHealingService.detectCongestionForAgency(agencyId));
    }

    /**
     * Get suggested self-healing actions.
     */
    @GetMapping("/actions")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<SelfHealingAction>> getSuggestedActions() {
        return ResponseEntity.ok(selfHealingService.getSuggestedActions());
    }

    /**
     * Execute a self-healing action.
     */
    @PostMapping("/actions/{actionId}/execute")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SelfHealingAction> executeAction(
            @PathVariable String actionId
    ) {
        return ResponseEntity.ok(selfHealingService.executeAction(actionId));
    }

    /**
     * Get route optimization for a courier.
     */
    @GetMapping("/route/courier/{courierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'COURIER')")
    public ResponseEntity<RouteOptimization> optimizeCourierRoute(
            @PathVariable UUID courierId
    ) {
        return ResponseEntity.ok(selfHealingService.optimizeCourierRoute(courierId));
    }

    /**
     * Notify clients about delays due to congestion.
     */
    @PostMapping("/notify/agency/{agencyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Map<String, Integer>> notifyAffectedClients(
            @PathVariable UUID agencyId,
            @RequestBody Map<String, String> body
    ) {
        String message = body.getOrDefault("message", "Your parcel may experience a slight delay.");
        int notified = selfHealingService.notifyAffectedClients(agencyId, message);
        return ResponseEntity.ok(Map.of("notifiedClients", notified));
    }
}
