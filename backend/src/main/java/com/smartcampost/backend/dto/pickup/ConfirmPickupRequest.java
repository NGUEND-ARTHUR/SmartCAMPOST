package com.smartcampost.backend.dto.pickup;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Request DTO for confirming a pickup via QR scan.
 * Agent scans the temporary QR, validates parcel details, and confirms pickup.
 */
@Data
public class ConfirmPickupRequest {

    // Temporary QR token scanned by agent
    private String temporaryQrToken;

    // OR pickup ID (if agent manually enters)
    private UUID pickupId;

    // ==================== PARCEL VALIDATION ====================
    // Agent validates/corrects the parcel description

    private Double actualWeight;              // Measured weight by agent
    private String actualDimensions;          // Measured dimensions
    private String validationComment;         // Agent's notes/corrections
    private boolean descriptionConfirmed;     // Agent confirms client description is accurate
    private String photoUrl;                  // Photo taken by agent

    // ==================== LABEL PRINTING ====================

    private boolean printLabel;               // Should print label immediately
    private int labelCopies;                  // Number of label copies (default: 2)

    // ==================== LOCATION ====================

    @NotNull(message = "latitude is required - GPS must be enabled")
    private Double latitude;                  // GPS location of pickup

    @NotNull(message = "longitude is required - GPS must be enabled")
    private Double longitude;
}
