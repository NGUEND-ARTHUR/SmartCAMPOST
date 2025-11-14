package com.smartcampost.backend.dto.notification;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class NotificationResponse {

    private UUID notifId;
    private UUID parcelId;
    private UUID clientId;
    private String channel;   // "SMS" / "PUSH"
    private String message;
    private Instant timestamp;
    private String status;    // "SENT" / "FAILED"
}
