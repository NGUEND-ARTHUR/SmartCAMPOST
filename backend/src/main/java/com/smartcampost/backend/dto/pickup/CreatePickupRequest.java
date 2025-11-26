package com.smartcampost.backend.dto.pickup;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreatePickupRequest {

    private UUID parcelId;
    private LocalDate requestedDate;
    private String timeWindow;
    private String comment; // optional
}
