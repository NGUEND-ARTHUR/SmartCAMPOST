package com.smartcampost.backend.dto.notification;

import com.smartcampost.backend.model.enums.NotificationChannel;
import com.smartcampost.backend.model.enums.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private UUID id;
    private UUID parcelId;
    private UUID clientId;
    private NotificationChannel channel;
    private String message;
    private Instant timestamp;
    private NotificationStatus status;
}
