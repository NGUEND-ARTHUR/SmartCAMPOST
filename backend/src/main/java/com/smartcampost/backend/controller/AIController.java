package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.ai.*;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
import com.smartcampost.backend.service.AIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    /**
     * Optimize delivery route for a courier
     * Uses nearest-neighbor algorithm with priority considerations
     */
    @PostMapping("/optimize-route")
    public ResponseEntity<RouteOptimizationResponse> optimizeRoute(
            @Valid @RequestBody RouteOptimizationRequest request
    ) {
        return ResponseEntity.ok(aiService.optimizeRoute(request));
    }

    /**
     * Process chatbot message
     * Returns AI-powered response with suggestions and actions
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request
    ) {
        return ResponseEntity.ok(aiService.processChat(request));
    }

    /**
     * Predict delivery time based on origin, destination, and service type
     */
    @PostMapping("/predict-delivery")
    public ResponseEntity<DeliveryPredictionResponse> predictDelivery(
            @Valid @RequestBody DeliveryPredictionRequest request
    ) {
        return ResponseEntity.ok(aiService.predictDeliveryTime(request));
    }
}
