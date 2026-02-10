package com.smartcampost.backend.dto.pickup;

import com.smartcampost.backend.model.enums.LocationMode;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreatePickupRequest {

    @NotNull(message = "parcelId is required")
    private UUID parcelId;

    @NotNull(message = "requestedDate is required")
    private LocalDate requestedDate;

    @NotNull(message = "timeWindow is required")
    private String timeWindow;

    @NotNull(message = "pickupLatitude is required - GPS must be enabled")
    private Double pickupLatitude;

    @NotNull(message = "pickupLongitude is required - GPS must be enabled")
    private Double pickupLongitude;

    /** Optional; defaults to GPS_DEFAULT when omitted */
    private LocationMode locationMode;

    private String comment; // optional
}
