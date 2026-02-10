package com.smartcampost.backend.dto.ai;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Congestion detection result for an agency.
 */
@Data
@Builder
public class CongestionAlert {
    private UUID agencyId;
    private String agencyName;
    private int parcelCount;
    private int threshold;
    private double congestionLevel;
    private Instant detectedAt;
    private List<String> suggestedActions;
}
