package com.smartcampost.backend.dto.scan;

import com.smartcampost.backend.model.enums.ParcelStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ScanEventResponse {

    private UUID id;

    private UUID parcelId;
    private String trackingRef;

    private UUID agencyId;
    private String agencyName;

    private UUID agentId;
    private String agentName;

    private String eventType;
    private Instant timestamp;
    private String locationNote;

    // statut du colis après cet event (facultatif mais utile pour la timeline)
    private ParcelStatus parcelStatusAfter;
}
