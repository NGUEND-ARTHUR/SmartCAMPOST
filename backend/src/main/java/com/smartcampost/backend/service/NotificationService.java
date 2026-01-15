package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.notification.NotificationResponse;
import com.smartcampost.backend.dto.notification.TriggerNotificationRequest;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PickupRequest;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    // Admin -> manuel
    NotificationResponse triggerNotification(TriggerNotificationRequest request);

    NotificationResponse getNotification(UUID id);

    com.smartcampost.backend.dto.common.PageResponse<NotificationResponse> listNotifications(int page, int size);

    NotificationResponse retryNotification(UUID id);

    List<NotificationResponse> listForParcel(UUID parcelId);

    List<NotificationResponse> listForPickup(UUID pickupId);

    // Intégration avec le business
    void notifyPickupRequested(PickupRequest pickup);

    void notifyPickupCompleted(PickupRequest pickup);

    void notifyParcelDelivered(Parcel parcel);

    // 🔥 NEW: notification lors de la création du colis
    void notifyParcelCreated(Parcel parcel);

    // 🔥 SPRINT 15: notification when parcel is validated/accepted by agent
    void notifyParcelAccepted(Parcel parcel);

    // 🔥 NEW: notification "out for delivery"
    void notifyParcelOutForDelivery(Parcel parcel);

    // 🔥 NEW: notification when parcel is in transit
    void notifyParcelInTransit(Parcel parcel);

    // 🔥 NEW: notification when parcel arrives at destination agency
    void notifyParcelArrivedDestination(Parcel parcel);

    // 🔥 NEW: reminder for uncollected parcels at agency
    void sendReminderForUncollectedParcel(Parcel parcel, int daysSinceArrival);

    // 🔥 NEW: notification when delivery is rescheduled
    void notifyDeliveryRescheduled(Parcel parcel, java.time.LocalDate newDate, String reason);

    // 🔥 NEW: notification when delivery attempt fails
    void notifyDeliveryAttemptFailed(Parcel parcel, int attemptNumber, String failureReason);

    // 🔥 NEW: utilisé par DeliveryOtpServiceImpl
    void sendDeliveryOtp(String phoneNumber, String otpCode, String trackingRef);
}
