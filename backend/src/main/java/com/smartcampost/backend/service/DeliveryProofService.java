package com.smartcampost.backend.service;

import com.smartcampost.backend.model.DeliveryProof;
import com.smartcampost.backend.model.enums.DeliveryProofType;

import java.util.Optional;
import java.util.UUID;

public interface DeliveryProofService {

    DeliveryProof captureProof(UUID parcelId,
                               DeliveryProofType proofType,
                               String details,       // OTP, photo path, signature data…
                               String capturedBy);   // courier id or staff id

    Optional<DeliveryProof> getProofForParcel(UUID parcelId);
}
