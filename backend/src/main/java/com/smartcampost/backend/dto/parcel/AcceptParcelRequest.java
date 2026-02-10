package com.smartcampost.backend.dto.parcel;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;

/**
 * Request DTO for accepting/validating a parcel.
 * The agent or courier validates the parcel description and can optionally update
 * certain fields (weight correction, add photo, add validation comment).
 * 
 * When an agent accepts a parcel:
 * - They confirm the parcel details are correct (description, weight, etc.)
 * - They can adjust the weight if the actual weight differs
 * - They can add a photo of the parcel
 * - They can add validation notes/comments
 * - The parcel status moves from CREATED → ACCEPTED
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcceptParcelRequest {

    /**
     * Validated weight (optional). If provided, overrides the original weight.
     * Use this when the agent weighs the parcel and finds a difference.
     */
    private Double validatedWeight;

    /**
     * Validated dimensions (optional). If provided, overrides the original dimensions.
     */
    private String validatedDimensions;

    /**
     * Photo URL of the parcel (optional). Agent can take a photo during acceptance.
     */
    private String photoUrl;

    /**
     * Validation comment (optional). Notes from the agent about the parcel condition,
     * any discrepancies found, or special handling instructions.
     */
    private String validationComment;

    /**
     * Confirmation that the parcel description is accurate.
     * Must be true for acceptance to proceed.
     */
    private boolean descriptionConfirmed;

    /**
     * If true and weight differs, create a price adjustment.
     * Default: false (no automatic price recalculation).
     */
    private boolean recalculatePriceOnWeightChange;

    // -------------------
    // GPS is mandatory (ScanEvent is required for ACCEPTED transition)
    // -------------------
    @NotNull(message = "latitude is required - GPS must be enabled")
    private Double latitude;

    @NotNull(message = "longitude is required - GPS must be enabled")
    private Double longitude;

    private String locationSource;
    private Instant deviceTimestamp;
    private String locationNote;
}
