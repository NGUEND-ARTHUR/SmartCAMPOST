package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ParcelService {

    Parcel createParcelRequest(UUID clientId,
                               UUID senderAddressId,
                               UUID recipientAddressId,
                               double weight,
                               String dimensions,
                               boolean fragile,
                               DeliveryOption deliveryOption,
                               String serviceTypeCode);

    Parcel updateParcelStatus(UUID parcelId, ParcelStatus status, String reason);

    Optional<Parcel> findByTrackingRef(String trackingRef);

    List<Parcel> getClientParcels(UUID clientId);

    byte[] generateParcelLabel(UUID parcelId); // for “Print & Attach QR Label”

    byte[] generateReceipt(UUID parcelId);     // for “Download Receipt”
}
