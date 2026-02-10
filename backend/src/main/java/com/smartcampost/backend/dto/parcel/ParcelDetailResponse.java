package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.dto.pricing.PricingDetailResponse;
import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.PaymentOption;
import com.smartcampost.backend.model.enums.QrStatus;
import com.smartcampost.backend.model.enums.ServiceType;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParcelDetailResponse {

    private UUID id;
    private String trackingRef;
    private String trackingNumber;

    private ParcelStatus status;
    private ServiceType serviceType;
    private DeliveryOption deliveryOption;
    private PaymentOption paymentOption;
    private String descriptionComment;
    private QrStatus qrStatus;
    private boolean locked;
    private String partialQrCode;
    private String finalQrCode;

    private double weight;
    private String dimensions;
    private double declaredValue;
    private boolean fragile;

    private Instant createdAt;
    private Instant expectedDeliveryAt;

    // ---- CLIENT ----
    private UUID clientId;
    private String clientName;

    // ---- SENDER ADDRESS ----
    private UUID senderAddressId;
    private String senderLabel;
    private String senderCity;
    private String senderRegion;
    private String senderCountry;

    // ---- RECIPIENT ADDRESS ----
    private UUID recipientAddressId;
    private String recipientLabel;
    private String recipientCity;
    private String recipientRegion;
    private String recipientCountry;

    // ---- AGENCIES ----
    private UUID originAgencyId;
    private String originAgencyName;

    private UUID destinationAgencyId;
    private String destinationAgencyName;

    // ---- PRICING ----
    private Double lastAppliedPrice;
    private List<PricingDetailResponse> pricingHistory;
}
