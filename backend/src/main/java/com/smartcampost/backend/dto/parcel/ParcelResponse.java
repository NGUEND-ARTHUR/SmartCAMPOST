package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ServiceType;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParcelResponse {

    private UUID id;
    private String trackingRef;
    private ParcelStatus status;
    private ServiceType serviceType;
    private DeliveryOption deliveryOption;
    private Double weight;
    private UUID clientId;
    private UUID senderAddressId;
    private UUID recipientAddressId;
    private Instant createdAt;
    private Instant expectedDeliveryAt;
}
