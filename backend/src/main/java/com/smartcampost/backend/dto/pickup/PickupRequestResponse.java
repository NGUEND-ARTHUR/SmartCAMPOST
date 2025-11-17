package com.smartcampost.backend.dto.pickup;

import com.smartcampost.backend.model.enums.PickupRequestState;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class PickupRequestResponse {

    private UUID id;
    private UUID parcelId;
    private LocalDate requestedDate;      // ✅ LocalDate to match entity
    private String timeWindow;
    private PickupRequestState state;
    private String comment;
    private UUID courierId;
}
