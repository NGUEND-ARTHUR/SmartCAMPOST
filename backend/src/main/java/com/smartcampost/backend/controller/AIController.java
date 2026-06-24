package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.ai.*;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
import com.smartcampost.backend.service.AIService;
import com.smartcampost.backend.service.AiAgentRecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class AIController {
    private final AIService aiService;
    private final AiAgentRecommendationService aiAgentRecommendationService;
    private final com.smartcampost.backend.service.orchestrator.AIOrchestrator aiOrchestrator;
    private final com.smartcampost.backend.repository.AiFeedbackRepository aiFeedbackRepository;
    

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
     * Streaming chat endpoint: returns progressive word-by-word chunks.
     * The AI response is generated first, then streamed word-by-word for
     * a natural typing effect. Each word group is flushed immediately.
     */
    @PostMapping(value = "/chat/stream")
    public ResponseEntity<org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody> chatStream(
            @Valid @RequestBody ChatRequest request
    ) {
        org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody stream = out -> {
            ChatResponse resp = aiService.processChat(request);
            String text = resp.getMessage() != null ? resp.getMessage() : "";
            String[] words = text.split("(?<=\\s)");
            int wordsPerChunk = 3;
            for (int i = 0; i < words.length; i += wordsPerChunk) {
                StringBuilder chunk = new StringBuilder();
                for (int j = i; j < Math.min(i + wordsPerChunk, words.length); j++) {
                    chunk.append(words[j]);
                }
                out.write(chunk.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
                out.flush();
                try { Thread.sleep(40); } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            out.flush();
        };
        return ResponseEntity.ok()
                .header("Content-Type", "text/plain; charset=utf-8")
                .header("Transfer-Encoding", "chunked")
                .body(stream);
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

    /**
     * Get latest AI recommendation for a courier
     * Returns optimized route, performance insights, and suggestions
     */
    @GetMapping("/agent/courier/{courierId}/recommendation")
    public ResponseEntity<AiAgentRecommendationResponse> getCourierRecommendation(
            @PathVariable("courierId") UUID courierId
    ) {
        return ResponseEntity.ok(aiAgentRecommendationService.getLatestForCourier(courierId));
    }

    /**
     * Get latest AI recommendation for an agency
     * Returns congestion alerts, redistribution suggestions, and insights
     */
    @GetMapping("/agent/agency/{agencyId}/recommendation")
    public ResponseEntity<AiAgentRecommendationResponse> getAgencyRecommendation(
            @PathVariable("agencyId") UUID agencyId
    ) {
        return ResponseEntity.ok(aiAgentRecommendationService.getLatestForAgency(agencyId));
    }

    /**
     * Get AI agent status for current authenticated user
     * Returns recommendations based on user's role and data
     */
    @GetMapping("/agent/status")
    public ResponseEntity<AgentStatusResponse> getAgentStatus() {
        return ResponseEntity.ok(aiService.getAgentStatus());
    }

    /**
     * Assess shipment risk for a parcel
     * Returns risk level, reason codes, and recommended action
     */
    @PostMapping("/assess-risk")
    public ResponseEntity<ShipmentRiskResponse> assessRisk(
            @Valid @RequestBody ShipmentRiskRequest request
    ) {
        return ResponseEntity.ok(aiOrchestrator.detectRisk(request));
    }

    @PostMapping("/feedback")
    public ResponseEntity<Map<String, Object>> feedback(@RequestBody Map<String, Object> payload) {
        log.info("AI feedback received: rating={}, feedback={}",
                payload.getOrDefault("rating", ""),
                payload.getOrDefault("feedback", ""));

        UUID userId = null;
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                userId = UUID.fromString(auth.getName());
            }
        } catch (Exception ignored) {}

        var fb = com.smartcampost.backend.model.AiFeedback.builder()
                .sessionId(String.valueOf(payload.getOrDefault("sessionId", "")))
                .userId(userId)
                .rating(String.valueOf(payload.getOrDefault("rating", "")))
                .feedbackText(String.valueOf(payload.getOrDefault("feedback", "")))
                .messageContent(String.valueOf(payload.getOrDefault("messageContent", "")))
                .build();
        aiFeedbackRepository.save(fb);

        return ResponseEntity.ok(Map.of(
                "status", "SAVED",
                "feedbackId", fb.getId().toString(),
                "receivedAt", Instant.now()
        ));
    }
}
