package com.smartcampost.backend.dto.pickup;

import com.smartcampost.backend.model.enums.PickupState;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class PickupRequestResponse {
    private UUID pickupId;
    private UUID parcelId;
    private LocalDate requestedDate;
    private String timeWindow;
    private PickupState state;
    private String comment;
    private Instant createdAt;
}
