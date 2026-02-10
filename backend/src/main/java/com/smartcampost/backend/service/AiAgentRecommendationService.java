package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.ai.AiAgentRecommendationResponse;

import java.util.UUID;

public interface AiAgentRecommendationService {
    AiAgentRecommendationResponse getLatestForCourier(UUID courierId);
    AiAgentRecommendationResponse getLatestForAgency(UUID agencyId);
}
