package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ServiceType;
import com.smartcampost.backend.model.enums.PaymentOption;
import com.smartcampost.backend.model.enums.QrStatus;
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
    private String trackingNumber;
    private ParcelStatus status;
    private ServiceType serviceType;
    private DeliveryOption deliveryOption;
    private Double weight;
    private UUID clientId;
    private UUID senderAddressId;
    private UUID recipientAddressId;

    // 🔥 NEW FIELDS
    private PaymentOption paymentOption;     // PREPAID / COD
    private String photoUrl;                 // optional photo
    private String descriptionComment;       // optional comment
    private QrStatus qrStatus;
    private boolean locked;
    // -----------

    private Double currentLatitude;
    private Double currentLongitude;
    private Instant locationUpdatedAt;

    private String senderCity;
    private String senderRegion;
    private String senderCountry;
    private String recipientCity;
    private String recipientRegion;
    private String recipientCountry;

    private Double creationLatitude;
    private Double creationLongitude;

    private Instant createdAt;
    private Instant expectedDeliveryAt;
}
