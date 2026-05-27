package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.delivery.StartDeliveryResponse;

import java.util.UUID;

public interface AssignmentService {
    StartDeliveryResponse assignCourier(UUID parcelId, UUID courierId, String reason);
}
