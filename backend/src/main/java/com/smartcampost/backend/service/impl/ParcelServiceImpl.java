package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.parcel.ParcelCreateRequest;
import com.smartcampost.backend.dto.parcel.ParcelDetailResponse;
import com.smartcampost.backend.dto.parcel.ParcelSummaryResponse;
import com.smartcampost.backend.model.Address;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ServiceType;
import com.smartcampost.backend.repository.AddressRepository;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.ParcelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParcelServiceImpl implements ParcelService {

    private final ParcelRepository parcelRepository;
    private final ClientRepository clientRepository;
    private final AddressRepository addressRepository;

    @Override
    public ParcelDetailResponse createParcel(ParcelCreateRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + request.getClientId()));

        Address sender = addressRepository.findById(request.getSenderAddressId())
                .orElseThrow(() -> new IllegalArgumentException("Sender address not found: " + request.getSenderAddressId()));

        Address recipient = addressRepository.findById(request.getRecipientAddressId())
                .orElseThrow(() -> new IllegalArgumentException("Recipient address not found: " + request.getRecipientAddressId()));

        // 🔁 Convert String -> enum ServiceType
        ServiceType serviceType = ServiceType.valueOf(
                request.getServiceType().toUpperCase().trim()
        );

        // (si dans le DTO tu as déjà DeliveryOption enum, on le prend direct)
        DeliveryOption deliveryOption = request.getDeliveryOption();

        Parcel parcel = Parcel.builder()
                .id(UUID.randomUUID())
                .trackingRef(request.getTrackingRef())
                .client(client)
                .senderAddress(sender)
                .recipientAddress(recipient)
                .weight(request.getWeight())
                .dimensions(request.getDimensions())
                .declaredValue(request.getDeclaredValue())
                .fragile(request.isFragile())
                .serviceType(serviceType)
                .deliveryOption(deliveryOption)
                .status(ParcelStatus.CREATED)
                .build();

        parcel = parcelRepository.save(parcel);
        return toDetail(parcel);
    }

    @Override
    public ParcelDetailResponse getParcel(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + parcelId));
        return toDetail(parcel);
    }

    @Override
    public ParcelDetailResponse getByTrackingRef(String trackingRef) {
        Parcel parcel = parcelRepository.findByTrackingRef(trackingRef)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found for tracking: " + trackingRef));
        return toDetail(parcel);
    }

    @Override
    public List<ParcelSummaryResponse> listClientParcels(UUID clientId) {
        return parcelRepository.findByClient_Id(clientId)
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Override
    public void updateParcelStatus(UUID parcelId, String status) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + parcelId));
        ParcelStatus newStatus = ParcelStatus.valueOf(status.toUpperCase().trim());
        parcel.setStatus(newStatus);
        parcelRepository.save(parcel);
    }

    private ParcelSummaryResponse toSummary(Parcel parcel) {
        return ParcelSummaryResponse.builder()
                .id(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .status(parcel.getStatus())
                // enum -> String pour le DTO
                .serviceType(parcel.getServiceType() != null ? parcel.getServiceType().name() : null)
                .createdAt(parcel.getCreatedAt())
                .build();
    }

    private ParcelDetailResponse toDetail(Parcel parcel) {
        return ParcelDetailResponse.builder()
                .id(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .clientId(parcel.getClient().getId())
                .senderAddressId(parcel.getSenderAddress().getId())
                .recipientAddressId(parcel.getRecipientAddress().getId())
                .weight(parcel.getWeight())
                .dimensions(parcel.getDimensions())
                .declaredValue(parcel.getDeclaredValue())
                .fragile(parcel.isFragile())
                // enum -> String pour le DTO
                .serviceType(parcel.getServiceType() != null ? parcel.getServiceType().name() : null)
                .deliveryOption(parcel.getDeliveryOption())
                .status(parcel.getStatus())
                .createdAt(parcel.getCreatedAt())
                .build();
    }
}
