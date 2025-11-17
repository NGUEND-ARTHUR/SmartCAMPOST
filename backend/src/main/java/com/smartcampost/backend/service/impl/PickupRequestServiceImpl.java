package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.pickup.PickupRequestCreateRequest;
import com.smartcampost.backend.dto.pickup.PickupRequestResponse;
import com.smartcampost.backend.model.Agent;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PickupRequest;
import com.smartcampost.backend.model.enums.PickupState;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PickupRequestRepository;
import com.smartcampost.backend.service.PickupRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PickupRequestServiceImpl implements PickupRequestService {

    private final PickupRequestRepository pickupRequestRepository;
    private final ParcelRepository parcelRepository;
    private final AgentRepository agentRepository;

    @Override
    public PickupRequestResponse createPickupRequest(PickupRequestCreateRequest request) {
        Parcel parcel = parcelRepository.findById(request.getParcelId())
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + request.getParcelId()));

        PickupRequest pickup = PickupRequest.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .requestedDate(request.getRequestedDate())
                .timeWindow(request.getTimeWindow())
                .state(PickupState.REQUESTED)
                .comment(request.getComment())
                .build();

        pickup = pickupRequestRepository.save(pickup);
        return toResponse(pickup);
    }

    @Override
    public PickupRequestResponse getPickupRequest(UUID pickupId) {
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new IllegalArgumentException("Pickup not found: " + pickupId));
        return toResponse(pickup);
    }

    @Override
    public void assignCourier(UUID pickupId, UUID courierId) {
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new IllegalArgumentException("Pickup not found: " + pickupId));
        Agent courier = agentRepository.findById(courierId)
                .orElseThrow(() -> new IllegalArgumentException("Courier not found: " + courierId));

        pickup.setCourier(courier);
        pickup.setState(PickupState.ASSIGNED);
        pickupRequestRepository.save(pickup);
    }

    @Override
    public void updatePickupState(UUID pickupId, String state) {
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new IllegalArgumentException("Pickup not found: " + pickupId));
        PickupState newState = PickupState.valueOf(state.toUpperCase());
        pickup.setState(newState);
        pickupRequestRepository.save(pickup);
    }

    private PickupRequestResponse toResponse(PickupRequest pickup) {
        PickupRequestResponse dto = new PickupRequestResponse();
        dto.setId(pickup.getId());
        dto.setParcelId(pickup.getParcel().getId());
        dto.setRequestedDate(pickup.getRequestedDate());
        dto.setTimeWindow(pickup.getTimeWindow());
        dto.setState(pickup.getState());
        dto.setComment(pickup.getComment());
        dto.setCourierId(pickup.getCourier() != null ? pickup.getCourier().getId() : null);
        return dto;
    }
}
