package com.smartcampost.backend.dto.notification;

import com.smartcampost.backend.model.enums.NotificationChannel;
import com.smartcampost.backend.model.enums.NotificationType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class TriggerNotificationRequest {

    @NotNull
    private NotificationChannel channel;

    @NotNull
    private NotificationType type;

    // Optionnels : l’admin peut lier à un colis ou un pickup
    private UUID parcelId;
    private UUID pickupId;

    // Override possible du destinataire
    private String recipientPhone;
    private String recipientEmail;

    // Personnalisation du contenu
    private String subject;
    private String message;
}
