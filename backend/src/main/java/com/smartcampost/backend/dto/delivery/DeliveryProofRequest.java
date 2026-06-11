package com.smartcampost.backend.dto.delivery;

import com.smartcampost.backend.model.enums.DeliveryProofType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class DeliveryProofRequest {

    @NotNull(message = "parcelId is required")
    private UUID parcelId;

    @NotNull(message = "courierId is required")
    private UUID courierId;

    @NotNull(message = "proofType is required")
    private DeliveryProofType proofType;

    private String details;
}
