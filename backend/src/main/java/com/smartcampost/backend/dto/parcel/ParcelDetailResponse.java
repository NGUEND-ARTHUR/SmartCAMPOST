package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParcelDetailResponse {

    private UUID id;
    private String trackingRef;
    private UUID clientId;
    private UUID senderAddressId;
    private UUID recipientAddressId;

    private Double weight;
    private String dimensions;
    private Double declaredValue;
    private boolean fragile;

    private String serviceType;
    private DeliveryOption deliveryOption;
    private ParcelStatus status;

    private Instant createdAt;
}
