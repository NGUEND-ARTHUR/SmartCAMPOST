package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ServiceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateParcelRequest {

    @NotNull
    private UUID senderAddressId;

    @NotNull
    private UUID recipientAddressId;

    private UUID originAgencyId;
    private UUID destinationAgencyId;

    @NotNull
    @Positive
    private Double weight;

    private String dimensions;

    private Double declaredValue;

    private boolean fragile;

    @NotNull
    private ServiceType serviceType;      // STANDARD / EXPRESS

    @NotNull
    private DeliveryOption deliveryOption; // AGENCY / HOME
}
