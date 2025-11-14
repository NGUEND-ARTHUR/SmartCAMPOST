package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ServiceType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ParcelCreateRequest {

    private UUID clientId;

    // Sender
    private String senderFullName;
    private String senderPhone;
    private String senderCity;
    private String senderRegion;
    private String senderCountry;
    private String senderLabel;

    // Recipient
    private String recipientFullName;
    private String recipientPhone;
    private String recipientCity;
    private String recipientRegion;
    private String recipientCountry;
    private String recipientLabel;

    // Parcel info
    private BigDecimal weight;
    private String dimensions;
    private BigDecimal declaredValue;
    private boolean fragile;

    private ServiceType serviceType;        // STANDARD, EXPRESS...
    private DeliveryOption deliveryOption;  // AGENCY, HOME
}
