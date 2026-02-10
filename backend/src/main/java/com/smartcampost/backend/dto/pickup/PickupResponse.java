package com.smartcampost.backend.dto.pickup;

import com.smartcampost.backend.model.enums.LocationMode;
import com.smartcampost.backend.model.enums.PickupRequestState;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class PickupResponse {

    private UUID id;

    private UUID parcelId;
    private String trackingRef;

    private UUID clientId;
    private String clientName;
    private String clientPhone;

    private UUID courierId;
    private String courierName;

    private LocalDate requestedDate;
    private String timeWindow;

    private PickupRequestState state;
    private String comment;

    // Pickup location
    private Double pickupLatitude;
    private Double pickupLongitude;
    private LocationMode locationMode;

    private Instant createdAt;   // 🔥 nouveau champ
}
