package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.notification.NotificationResponse;
import com.smartcampost.backend.dto.notification.NotificationSendRequest;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    NotificationResponse sendNotification(NotificationSendRequest request);

    List<NotificationResponse> listByParcel(UUID parcelId);

    List<NotificationResponse> listByClient(UUID clientId);
}
