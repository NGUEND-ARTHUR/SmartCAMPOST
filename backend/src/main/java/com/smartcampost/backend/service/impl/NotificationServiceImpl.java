package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.notification.NotificationResponse;
import com.smartcampost.backend.dto.notification.NotificationSendRequest;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.Notification;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.NotificationStatus;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.repository.NotificationRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final ParcelRepository parcelRepository;
    private final ClientRepository clientRepository;

    @Override
    public NotificationResponse sendNotification(NotificationSendRequest request) {

        Parcel parcel = parcelRepository.findById(request.getParcelId())
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + request.getParcelId()));

        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + request.getClientId()));

        Notification notif = Notification.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .client(client)
                .channel(request.getChannel())   // ⬅️ maintenant correct
                .message(request.getMessage())
                .status(NotificationStatus.SENT)
                .build();

        notif = notificationRepository.save(notif);
        return toResponse(notif);
    }

    @Override
    public List<NotificationResponse> listByParcel(UUID parcelId) {
        return notificationRepository.findByParcel_Id(parcelId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponse> listByClient(UUID clientId) {
        return notificationRepository.findByClient_Id(clientId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private NotificationResponse toResponse(Notification notif) {
        return NotificationResponse.builder()
                .id(notif.getId())
                .parcelId(notif.getParcel().getId())
                .clientId(notif.getClient().getId())
                .channel(notif.getChannel())
                .message(notif.getMessage())
                .timestamp(notif.getTimestamp())
                .status(notif.getStatus())
                .build();
    }
}
