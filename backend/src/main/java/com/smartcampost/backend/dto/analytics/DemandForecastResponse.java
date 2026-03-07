package com.smartcampost.backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandForecastResponse {
    private UUID agencyId;
    private String agencyName;
    private String region;
    private List<DailyForecast> forecasts;
    private Integer currentBacklog;
    private Double averageDailyVolume;
    private String trend; // "INCREASING", "STABLE", "DECREASING"
    private Double confidenceScore;
    private String recommendation;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyForecast {
        private LocalDate date;
        private Integer predictedVolume;
        private Double confidence;
        private String demandLevel; // "LOW", "NORMAL", "HIGH", "PEAK"
    }
}
