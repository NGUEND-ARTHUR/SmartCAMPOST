package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Notification;
import com.smartcampost.backend.model.enums.NotificationChannel;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    Notification sendParcelNotification(UUID parcelId,
                                        UUID clientId,
                                        NotificationChannel channel,
                                        String templateCode,
                                        Object templateData);

    List<Notification> getNotificationsForParcel(UUID parcelId);

    List<Notification> getNotificationsForClient(UUID clientId);
}
