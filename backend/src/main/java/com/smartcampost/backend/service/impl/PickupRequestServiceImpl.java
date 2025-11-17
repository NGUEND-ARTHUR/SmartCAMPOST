package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.pickup.PickupRequestCreateRequest;
import com.smartcampost.backend.dto.pickup.PickupRequestResponse;
import com.smartcampost.backend.model.Courier;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PickupRequest;
import com.smartcampost.backend.model.enums.PickupRequestState;
import com.smartcampost.backend.repository.CourierRepository;
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
    private final CourierRepository courierRepository;

    @Override
    public PickupRequestResponse createPickupRequest(PickupRequestCreateRequest request) {
        Parcel parcel = parcelRepository.findById(request.getParcelId())
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + request.getParcelId()));

        PickupRequest pickup = PickupRequest.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .requestedDate(request.getRequestedDate())     // ✅ LocalDate -> LocalDate
                .timeWindow(request.getTimeWindow())
                .state(PickupRequestState.REQUESTED)           // ✅ matches entity enum
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

        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() -> new IllegalArgumentException("Courier not found: " + courierId));

        pickup.setCourier(courier);                        // Courier type
        pickup.setState(PickupRequestState.ASSIGNED);      // entity enum
        pickupRequestRepository.save(pickup);
    }

    @Override
    public void updatePickupState(UUID pickupId, String state) {
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new IllegalArgumentException("Pickup not found: " + pickupId));

        PickupRequestState newState = PickupRequestState.valueOf(state.toUpperCase());
        pickup.setState(newState);
        pickupRequestRepository.save(pickup);
    }

    private PickupRequestResponse toResponse(PickupRequest pickup) {
        PickupRequestResponse dto = new PickupRequestResponse();
        dto.setId(pickup.getId());
        dto.setParcelId(pickup.getParcel().getId());
        dto.setRequestedDate(pickup.getRequestedDate());   // ✅ LocalDate -> LocalDate
        dto.setTimeWindow(pickup.getTimeWindow());
        dto.setState(pickup.getState());                   // PickupRequestState -> PickupRequestState
        dto.setComment(pickup.getComment());
        dto.setCourierId(
                pickup.getCourier() != null ? pickup.getCourier().getId() : null
        );
        return dto;
    }
}
