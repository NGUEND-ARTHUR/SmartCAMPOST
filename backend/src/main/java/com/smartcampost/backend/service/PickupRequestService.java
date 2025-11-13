package com.smartcampost.backend.service;

import com.smartcampost.backend.model.PickupRequest;
import com.smartcampost.backend.model.enums.PickupRequestState;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PickupRequestService {

    PickupRequest requestPickup(UUID parcelId, LocalDate requestedDate, String timeWindow, String comment);

    PickupRequest schedulePickup(UUID pickupId, UUID courierId);

    PickupRequest updateState(UUID pickupId, PickupRequestState state);

    List<PickupRequest> listPendingPickupsForCourier(UUID courierId);
}
