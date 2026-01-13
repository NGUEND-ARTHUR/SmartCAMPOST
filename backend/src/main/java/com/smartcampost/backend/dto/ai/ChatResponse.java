package com.smartcampost.backend.dto.ai;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ChatResponse {

    private String message;
    private String sessionId;
    private List<String> suggestions;
    private String intent; // Detected intent like "TRACKING", "PRICING", "SUPPORT"
    private Double confidence;
    private ActionData action; // Optional action to trigger in UI

    @Data
    @Builder
    public static class ActionData {
        private String type; // "NAVIGATE", "TRACK", "CONTACT", "CREATE_TICKET"
        private String payload;
    }
}
