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
public class ParcelDetailResponse {

    private UUID parcelId;
    private String trackingRef;

    private UUID clientId;

    // Sender address (flattened – easy to show in UI)
    private UUID senderAddressId;
    private String senderFullName;
    private String senderPhone;
    private String senderCity;
    private String senderRegion;
    private String senderCountry;

    // Recipient address (flattened)
    private UUID recipientAddressId;
    private String recipientFullName;
    private String recipientPhone;
    private String recipientCity;
    private String recipientRegion;
    private String recipientCountry;

    // Parcel info
    private BigDecimal weight;
    private String dimensions;
    private BigDecimal declaredValue;
    private boolean fragile;

    private ServiceType serviceType;
    private DeliveryOption deliveryOption;
    private ParcelStatus status;

    private Instant createdAt;
    private Instant lastUpdatedAt;
}
