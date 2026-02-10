package com.smartcampost.backend.dto.delivery;

import lombok.Data;

/**
 * Request to return a parcel to sender after failure.
 */
@Data
public class ReturnToSenderRequest {
    private String reason;
    private String notes;

    // GPS is mandatory
    private Double latitude;
    private Double longitude;
}
