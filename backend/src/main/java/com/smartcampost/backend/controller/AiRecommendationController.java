package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.ai.AiAgentRecommendationResponse;
import com.smartcampost.backend.service.AiAgentRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai/recommendations")
@RequiredArgsConstructor
public class AiRecommendationController {

    private final AiAgentRecommendationService aiAgentRecommendationService;

    @GetMapping("/couriers/{courierId}/latest")
    public ResponseEntity<AiAgentRecommendationResponse> latestCourierRecommendation(
            @PathVariable UUID courierId
    ) {
        return ResponseEntity.ok(aiAgentRecommendationService.getLatestForCourier(courierId));
    }

    @GetMapping("/agencies/{agencyId}/latest")
    public ResponseEntity<AiAgentRecommendationResponse> latestAgencyRecommendation(
            @PathVariable UUID agencyId
    ) {
        return ResponseEntity.ok(aiAgentRecommendationService.getLatestForAgency(agencyId));
    }
}
