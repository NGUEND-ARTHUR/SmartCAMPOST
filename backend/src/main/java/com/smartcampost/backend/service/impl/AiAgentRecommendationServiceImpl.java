package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ai.AiAgentRecommendationResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.AiAgentRecommendation;
import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import com.smartcampost.backend.repository.AiAgentRecommendationRepository;
import com.smartcampost.backend.service.AiAgentRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiAgentRecommendationServiceImpl implements AiAgentRecommendationService {

    private final AiAgentRecommendationRepository recommendationRepository;

    @Override
    public AiAgentRecommendationResponse getLatestForCourier(UUID courierId) {
        AiAgentRecommendation rec = recommendationRepository
                .findTopByModuleTypeAndSubjectTypeAndSubjectIdOrderByCreatedAtDesc(
                        AiModuleType.COURIER,
                        AiSubjectType.COURIER,
                        courierId
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "AI recommendation not found for courier",
                        ErrorCode.AI_RECOMMENDATION_NOT_FOUND
                ));
        return toResponse(rec);
    }

    @Override
    public AiAgentRecommendationResponse getLatestForAgency(UUID agencyId) {
        AiAgentRecommendation rec = recommendationRepository
                .findTopByModuleTypeAndSubjectTypeAndSubjectIdOrderByCreatedAtDesc(
                        AiModuleType.AGENCY,
                        AiSubjectType.AGENCY,
                        agencyId
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "AI recommendation not found for agency",
                        ErrorCode.AI_RECOMMENDATION_NOT_FOUND
                ));
        return toResponse(rec);
    }

    private static AiAgentRecommendationResponse toResponse(AiAgentRecommendation rec) {
        return AiAgentRecommendationResponse.builder()
                .id(rec.getId())
                .moduleType(rec.getModuleType())
                .subjectType(rec.getSubjectType())
                .subjectId(rec.getSubjectId())
                .summary(rec.getSummary())
                .payloadJson(rec.getPayloadJson())
                .createdAt(rec.getCreatedAt())
                .build();
    }
}
