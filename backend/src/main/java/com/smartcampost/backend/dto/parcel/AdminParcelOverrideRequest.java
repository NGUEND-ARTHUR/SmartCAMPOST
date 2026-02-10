package com.smartcampost.backend.dto.parcel;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.Instant;

/**
 * Admin-only exceptional override after a parcel is locked.
 * Must be audited (service will create a neutral ScanEvent).
 */
@Data
public class AdminParcelOverrideRequest {

    private String descriptionComment;

    @Positive(message = "declaredValue must be positive")
    private Double declaredValue;

    private Boolean fragile;

    @NotBlank(message = "reason is required")
    private String reason;

    // Mandatory GPS for audit
    @NotNull(message = "latitude is required - GPS must be enabled")
    private Double latitude;

    @NotNull(message = "longitude is required - GPS must be enabled")
    private Double longitude;

    private String locationSource;
    private Instant deviceTimestamp;

    private String proofUrl;
    private String comment;
    private String locationNote;
}
