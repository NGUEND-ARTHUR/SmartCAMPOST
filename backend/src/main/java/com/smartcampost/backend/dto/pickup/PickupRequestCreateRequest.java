package com.smartcampost.backend.dto.pickup;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class PickupRequestCreateRequest {

    private UUID parcelId;
    private LocalDate requestedDate;   // ✅ LocalDate to match entity
    private String timeWindow;
    private String comment;
}
