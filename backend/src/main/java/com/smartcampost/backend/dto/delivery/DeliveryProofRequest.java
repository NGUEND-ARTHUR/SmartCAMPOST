package com.smartcampost.backend.dto.delivery;

import com.smartcampost.backend.model.enums.DeliveryProofType;
import lombok.Data;

import java.util.UUID;

@Data
public class DeliveryProofRequest {

    private UUID parcelId;
    private UUID courierId;
    private DeliveryProofType proofType;
    private String details; // URL, hash, or description
}
