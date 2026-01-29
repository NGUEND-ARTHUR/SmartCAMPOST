package com.smartcampost.backend.service.orchestrator;

import com.smartcampost.backend.dto.ai.ChatRequest;
import com.smartcampost.backend.dto.ai.ChatResponse;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
import com.smartcampost.backend.dto.ai.RouteOptimizationRequest;
import com.smartcampost.backend.dto.ai.RouteOptimizationResponse;
public interface AIOrchestrator {
    ChatResponse handleChat(ChatRequest request);

    RouteOptimizationResponse recommendRoute(RouteOptimizationRequest request);

    DeliveryPredictionResponse predictEta(DeliveryPredictionRequest request);

    com.smartcampost.backend.dto.ai.ShipmentRiskResponse detectRisk(com.smartcampost.backend.dto.ai.ShipmentRiskRequest request);
}
