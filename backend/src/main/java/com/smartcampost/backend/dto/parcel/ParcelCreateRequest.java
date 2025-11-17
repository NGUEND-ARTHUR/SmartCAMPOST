package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.DeliveryOption;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class ParcelCreateRequest {

    @NotNull
    private UUID clientId;

    @NotNull
    private UUID senderAddressId;

    @NotNull
    private UUID recipientAddressId;

    // Tu peux aussi le laisser nullable si tu veux le générer côté backend
    @NotBlank
    private String trackingRef;

    @NotNull
    private Double weight;

    private String dimensions;

    private Double declaredValue;

    private boolean fragile;

    @NotBlank
    private String serviceType;

    @NotNull
    private DeliveryOption deliveryOption;
}
