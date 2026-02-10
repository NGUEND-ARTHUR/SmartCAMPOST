package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.ParcelStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateParcelStatusRequest {

    @NotNull
    private ParcelStatus status;

    // GPS is mandatory because every status transition must be backed by a ScanEvent
    @NotNull(message = "latitude is required - GPS must be enabled")
    private Double latitude;

    @NotNull(message = "longitude is required - GPS must be enabled")
    private Double longitude;

    private String locationSource;
    private Instant deviceTimestamp;
    private String locationNote;
    private String comment;
    private String proofUrl;
}
