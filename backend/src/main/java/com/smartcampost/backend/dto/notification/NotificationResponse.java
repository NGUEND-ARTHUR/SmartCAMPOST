package com.smartcampost.backend.dto.notification;

import com.smartcampost.backend.model.enums.NotificationChannel;
import com.smartcampost.backend.model.enums.NotificationStatus;
import com.smartcampost.backend.model.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {

    private UUID id;

    private UUID parcelId;
    private String parcelTrackingRef;

    private UUID pickupId;

    private String recipientPhone;
    private String recipientEmail;

    private NotificationChannel channel;
    private NotificationType type;
    private NotificationStatus status;

    private String subject;
    private String message;
    private String errorMessage;

    private int retryCount;
    private Instant createdAt;
    private Instant sentAt;
}
