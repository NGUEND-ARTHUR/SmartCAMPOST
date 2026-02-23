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
    private final com.smartcampost.backend.service.ai.agents.RiskDetectionAgent riskDetectionAgent;

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
        return riskDetectionAgent.detect(request);
    }
}
