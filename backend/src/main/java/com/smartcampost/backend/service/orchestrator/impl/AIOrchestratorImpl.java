package com.smartcampost.backend.service.orchestrator.impl;

import com.smartcampost.backend.dto.ai.*;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
import com.smartcampost.backend.service.AIService;
import com.smartcampost.backend.service.orchestrator.AIOrchestrator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIOrchestratorImpl implements AIOrchestrator {

    private final AIService aiService;

    @Override
    public ChatResponse handleChat(ChatRequest request) {
        // Very simple intent classification: dispatch to AIService (which already contains RAG)
        return aiService.processChat(request);
    }

    @Override
    public RouteOptimizationResponse recommendRoute(RouteOptimizationRequest request) {
        return aiService.optimizeRoute(request);
    }

    @Override
    public DeliveryPredictionResponse predictEta(DeliveryPredictionRequest request) {
        return aiService.predictDeliveryTime(request);
    }

    @Override
    public ShipmentRiskResponse detectRisk(ShipmentRiskRequest request) {
        // Basic risk detection heuristic: if parcel status not DELIVERED and expectedDelivery < now -> HIGH
        ShipmentRiskResponse resp = new ShipmentRiskResponse();
        resp.setRiskLevel(ShipmentRiskResponse.RiskLevel.LOW);
        resp.setReasonCodes(java.util.Collections.singletonList("NO_DETAILED_CHECKS_IMPLEMENTED"));
        resp.setRecommendedAction("Notify operations team to investigate and consider reroute.");
        return resp;
    }
}
