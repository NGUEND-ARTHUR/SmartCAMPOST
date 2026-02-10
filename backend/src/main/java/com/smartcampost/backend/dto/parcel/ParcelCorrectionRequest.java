package com.smartcampost.backend.dto.parcel;

import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * Request for correcting parcel data before validation.
 * Only allowed when parcel is not yet locked (qrStatus = PARTIAL).
 * Roles: AGENT, COURIER, STAFF, ADMIN
 */
@Data
public class ParcelCorrectionRequest {

    private String description;

    @Positive(message = "weight must be positive")
    private Double weight;

    private String dimensions;

    @Positive(message = "declaredValue must be positive")
    private Double declaredValue;

    private String deliveryOption;

    private String serviceType;

    private Boolean fragile;

    private String descriptionComment;

    /**
     * Reason for the correction (audit trail)
     */
    private String correctionReason;
}
