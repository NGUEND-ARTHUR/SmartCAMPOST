package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ServiceType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ParcelResponse {

    private UUID parcelId;
    private String trackingRef;

    private UUID clientId;

    private UUID senderAddressId;
    private UUID recipientAddressId;

    private BigDecimal weight;
    private String dimensions;
    private BigDecimal declaredValue;
    private boolean fragile;

    private ServiceType serviceType;
    private DeliveryOption deliveryOption;
    private ParcelStatus status;

    private Instant createdAt;
}
