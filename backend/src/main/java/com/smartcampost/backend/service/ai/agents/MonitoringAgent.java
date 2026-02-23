package com.smartcampost.backend.service.ai.agents;

import com.smartcampost.backend.dto.ai.AgentStatusResponse;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.AiAgentRecommendationRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringAgent {

    private final UserAccountRepository userAccountRepository;
    private final AiAgentRecommendationRepository aiAgentRecommendationRepository;

    public AgentStatusResponse getStatus() {
        log.info("Fetching agent status for authenticated user");

        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return AgentStatusResponse.builder()
                        .role("GUEST")
                        .agentHealth("OFFLINE")
                        .summary("No authenticated user")
                        .recommendations(Collections.emptyList())
                        .build();
            }

            String subject = auth.getName();
            UUID userId;
            try {
                userId = UUID.fromString(subject);
            } catch (IllegalArgumentException ex) {
                return AgentStatusResponse.builder()
                        .role("GUEST")
                        .agentHealth("OFFLINE")
                        .summary("Invalid user ID")
                        .recommendations(Collections.emptyList())
                        .build();
            }

            var userOpt = userAccountRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return AgentStatusResponse.builder()
                        .role("GUEST")
                        .agentHealth("OFFLINE")
                        .summary("User not found")
                        .recommendations(Collections.emptyList())
                        .build();
            }

            var user = userOpt.get();
            UserRole userRole = user.getRole();
            List<AgentStatusResponse.RecommendationItem> recommendations = new ArrayList<>();
            Optional<com.smartcampost.backend.model.AiAgentRecommendation> recommendationOpt = Optional.empty();

            UUID entityId = user.getEntityId();
            if (userRole == UserRole.COURIER && entityId != null) {
                recommendationOpt = aiAgentRecommendationRepository
                        .findTopByModuleTypeAndSubjectTypeAndSubjectIdOrderByCreatedAtDesc(
                                com.smartcampost.backend.model.enums.AiModuleType.COURIER,
                                com.smartcampost.backend.model.enums.AiSubjectType.COURIER,
                                entityId
                        );
            } else if (userRole == UserRole.CLIENT && entityId != null) {
                recommendationOpt = aiAgentRecommendationRepository
                        .findTopBySubjectTypeAndSubjectIdOrderByCreatedAtDesc(
                                com.smartcampost.backend.model.enums.AiSubjectType.CLIENT,
                                entityId
                        );
            } else if ((userRole == UserRole.AGENT || userRole == UserRole.STAFF || userRole == UserRole.ADMIN)
                    && entityId != null) {
                recommendationOpt = aiAgentRecommendationRepository
                        .findTopBySubjectTypeAndSubjectIdOrderByCreatedAtDesc(
                                com.smartcampost.backend.model.enums.AiSubjectType.AGENCY,
                                entityId
                        );
                if (recommendationOpt.isEmpty()) {
                    recommendationOpt = aiAgentRecommendationRepository
                            .findTopByModuleTypeOrderByCreatedAtDesc(
                                    com.smartcampost.backend.model.enums.AiModuleType.AGENCY
                            );
                }
            } else if (userRole == UserRole.RISK) {
                recommendationOpt = aiAgentRecommendationRepository
                        .findTopByModuleTypeOrderByCreatedAtDesc(
                                com.smartcampost.backend.model.enums.AiModuleType.RISK
                        );
            } else if (userRole == UserRole.FINANCE) {
                recommendationOpt = aiAgentRecommendationRepository
                        .findTopByModuleTypeOrderByCreatedAtDesc(
                                com.smartcampost.backend.model.enums.AiModuleType.PREDICTIVE
                        );
            }

            recommendationOpt.ifPresent(rec -> recommendations.add(
                    AgentStatusResponse.RecommendationItem.builder()
                            .title(rec.getModuleType() + " Recommendation")
                            .description(rec.getSummary() != null ? rec.getSummary() : "Autonomous agent recommendation available")
                            .priority("MEDIUM")
                            .actionType(rec.getModuleType() != null ? rec.getModuleType().name() : "INFO")
                            .payload(rec.getPayloadJson())
                            .createdAt(rec.getCreatedAt() != null ? rec.getCreatedAt().toEpochMilli() : System.currentTimeMillis())
                            .build()
            ));

            if (recommendations.isEmpty()) {
                recommendations.add(AgentStatusResponse.RecommendationItem.builder()
                        .title("AI Agents Active")
                        .description("Autonomous agents are running. New recommendations will appear as events are recorded.")
                        .priority("LOW")
                        .actionType("INFO")
                        .createdAt(System.currentTimeMillis())
                        .build());
            }

            return AgentStatusResponse.builder()
                    .role(userRole.toString())
                    .agentHealth("HEALTHY")
                    .summary("AI agents are operational with " + recommendations.size() + " recommendation(s)")
                    .recommendations(recommendations)
                    .lastActivityAt(System.currentTimeMillis())
                    .build();

        } catch (Exception ex) {
            log.error("Error getting agent status: {}", ex.getMessage());
            return AgentStatusResponse.builder()
                    .role("UNKNOWN")
                    .agentHealth("DEGRADED")
                    .summary("Error retrieving agent status: " + ex.getMessage())
                    .recommendations(Collections.emptyList())
                    .build();
        }
    }
}
