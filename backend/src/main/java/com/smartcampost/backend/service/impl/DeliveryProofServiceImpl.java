package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.delivery.DeliveryProofRequest;
import com.smartcampost.backend.model.Courier;
import com.smartcampost.backend.model.DeliveryProof;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.DeliveryProofType;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.DeliveryProofRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.DeliveryProofService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeliveryProofServiceImpl implements DeliveryProofService {

    private final DeliveryProofRepository deliveryProofRepository;
    private final ParcelRepository parcelRepository;
    private final CourierRepository courierRepository;

    // ========= Impl de la méthode avec DTO =========
    @Override
    @Transactional
    public DeliveryProof captureProof(DeliveryProofRequest request) {
        Objects.requireNonNull(request, "request is required");
        String capturedBy = request.getCourierId() != null
                ? request.getCourierId().toString()
                : null;

        return captureProof(
                request.getParcelId(),
                request.getProofType(),
                request.getDetails(),
                capturedBy
        );
    }

    // ========= Impl de la méthode principale de l’interface =========
    @Override
    @Transactional
    public DeliveryProof captureProof(UUID parcelId,
                                      DeliveryProofType proofType,
                                      String details,
                                      String capturedBy) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(proofType, "proofType is required");

        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found"));

        Courier courier = null;
        if (capturedBy != null) {
            try {
                UUID courierId = UUID.fromString(capturedBy);
                courier = courierRepository.findById(courierId).orElse(null);
            } catch (IllegalArgumentException ex) {
                // capturedBy n’est pas un UUID valide → on ignore, courier reste null
            }
        }

        DeliveryProof proof = DeliveryProof.builder()
                .parcel(parcel)
                .courier(courier)
                .proofType(proofType)
                .details(details)
                .timestamp(Instant.now())
                .build();

        return deliveryProofRepository.save(proof);
    }

    @Override
    public Optional<DeliveryProof> getProofForParcel(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found"));
        return deliveryProofRepository.findByParcel(parcel);
    }
}
