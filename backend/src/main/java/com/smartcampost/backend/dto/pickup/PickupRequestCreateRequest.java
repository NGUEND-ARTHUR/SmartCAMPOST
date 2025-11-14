package com.smartcampost.backend.dto.pickup;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class PickupRequestCreateRequest {

    private UUID parcelId;

    private LocalDate requestedDate;  // e.g. 2025-11-15
    private String timeWindow;        // e.g. "08:00-12:00"

    private String comment;           // optional note for the driver
}
