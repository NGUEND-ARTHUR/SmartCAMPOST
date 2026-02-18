package com.smartcampost.backend.dto.ai;

import lombok.Builder;
import lombok.Data;
import java.util.List;

/**
 * Response containing agent status and recommendations for authenticated user
 */
@Data
@Builder
public class AgentStatusResponse {

    /** User's role */
    private String role;

    /** List of active recommendations for the user */
    private List<RecommendationItem> recommendations;

    /** Agent health status */
    private String agentHealth; // "HEALTHY", "DEGRADED", "OFFLINE"

    /** Summary of AI insights */
    private String summary;

    /** Timestamp of last agent activity */
    private Long lastActivityAt;

    @Data
    @Builder
    public static class RecommendationItem {
        private String title;
        private String description;
        private String priority; // "HIGH", "MEDIUM", "LOW"
        private String actionType; // "OPTIMIZE", "ALERT", "INFO", "ACTION"
        private Object payload;
        private Long createdAt;
    }
}
