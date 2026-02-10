package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.ai.CongestionAlert;
import com.smartcampost.backend.dto.ai.RouteOptimization;
import com.smartcampost.backend.dto.ai.SelfHealingAction;

import java.util.List;
import java.util.UUID;

/**
 * Service for self-healing logistics system.
 * Detects congestion, suggests redistributions, optimizes routes.
 */
public interface SelfHealingService {

    /**
     * Detect congestion across all agencies.
     */
    List<CongestionAlert> detectCongestion();

    /**
     * Detect congestion for a specific agency.
     */
    CongestionAlert detectCongestionForAgency(UUID agencyId);

    /**
     * Get suggested self-healing actions.
     */
    List<SelfHealingAction> getSuggestedActions();

    /**
     * Execute a self-healing action.
     */
    SelfHealingAction executeAction(String actionId);

    /**
     * Get route optimization for a courier.
     */
    RouteOptimization optimizeCourierRoute(UUID courierId);

    /**
     * Notify clients about delays due to congestion.
     */
    int notifyAffectedClients(UUID agencyId, String message);
}
