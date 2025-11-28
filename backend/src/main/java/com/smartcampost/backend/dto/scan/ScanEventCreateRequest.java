package com.smartcampost.backend.dto.scan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ScanEventCreateRequest {

    @NotNull
    private UUID parcelId;

    private UUID agencyId;    // optionnel

    private UUID agentId;     // optionnel (sinon on peut déduire depuis le user courant si c’est un AGENT)

    /**
     * Type d’évènement, ex:
     *  "ARRIVAL", "DEPARTURE", "OUT_FOR_DELIVERY", "DELIVERED", ...
     *  On fera un ScanEventType.valueOf(eventType.toUpperCase()) côté service.
     */
    @NotBlank
    private String eventType;

    private String locationNote;
}
