package com.smartcampost.backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentAnalysisResponse {
    private String overallSentiment; // "POSITIVE", "NEUTRAL", "NEGATIVE"
    private Double sentimentScore;   // -1.0 to 1.0
    private Integer totalInteractions;
    private Integer positiveCount;
    private Integer neutralCount;
    private Integer negativeCount;
    private List<TopIssue> topIssues;
    private Double satisfactionRate;  // 0-100%

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopIssue {
        private String category;
        private Integer count;
        private Double percentage;
    }
}
