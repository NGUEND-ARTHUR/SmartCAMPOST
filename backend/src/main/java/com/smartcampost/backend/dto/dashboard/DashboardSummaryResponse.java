package com.smartcampost.backend.dto.dashboard;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DashboardSummaryResponse {

    private Map<String, Object> metrics;
}