package com.smartcampost.backend.dto.notification;

import com.smartcampost.backend.model.enums.NotificationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class NotificationSendRequest {

    @NotNull
    private UUID parcelId;

    @NotNull
    private UUID clientId;

    @NotNull
    private NotificationChannel channel;  // SMS, PUSH

    @NotBlank
    private String message;
}
