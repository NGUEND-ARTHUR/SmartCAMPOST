package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.pickup.PickupRequestCreateRequest;
import com.smartcampost.backend.dto.pickup.PickupRequestResponse;

import java.util.UUID;

public interface PickupRequestService {

    PickupRequestResponse createPickupRequest(PickupRequestCreateRequest request);

    PickupRequestResponse getPickupRequest(UUID pickupId);

    void assignCourier(UUID pickupId, UUID courierId);

    void updatePickupState(UUID pickupId, String state);
}
