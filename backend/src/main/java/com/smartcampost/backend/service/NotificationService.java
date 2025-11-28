package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.notification.NotificationResponse;
import com.smartcampost.backend.dto.notification.TriggerNotificationRequest;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PickupRequest;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    // Admin -> manuel
    NotificationResponse triggerNotification(TriggerNotificationRequest request);

    NotificationResponse getNotification(UUID id);

    Page<NotificationResponse> listNotifications(int page, int size);

    NotificationResponse retryNotification(UUID id);

    List<NotificationResponse> listForParcel(UUID parcelId);

    List<NotificationResponse> listForPickup(UUID pickupId);

    // Intégration avec le business
    void notifyPickupRequested(PickupRequest pickup);

    void notifyPickupCompleted(PickupRequest pickup);

    void notifyParcelDelivered(Parcel parcel);
}
