package com.smartcampost.backend.dto.ai;

import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AiAgentRecommendationResponse {
    private UUID id;
    private AiModuleType moduleType;
    private AiSubjectType subjectType;
    private UUID subjectId;
    private String summary;
    private String payloadJson;
    private Instant createdAt;
}
