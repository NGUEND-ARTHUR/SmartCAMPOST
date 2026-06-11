package com.smartcampost.backend.dto.delivery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class DeliveryOtpSendRequest {
    @NotNull(message = "parcelId is required")
    private UUID parcelId;

    @NotBlank(message = "phoneNumber is required")
    private String phoneNumber;

    @NotNull(message = "latitude is required")
    private Double latitude;

    @NotNull(message = "longitude is required")
    private Double longitude;

    private String notes;
}
