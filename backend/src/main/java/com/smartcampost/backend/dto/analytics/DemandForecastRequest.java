package com.smartcampost.backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandForecastRequest {
    private UUID agencyId;
    private String region;
    private Integer forecastDays; // how many days ahead to predict (default 7)
}
