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

    // ================== GPS MANDATORY (SPEC SECTION 3) ==================
    private Double latitude;
    private Double longitude;
    private String locationSource;  // GPS, CELL, MANUAL

    // ================== ACTOR INFO (SPEC SECTION 12) ==================
    private String actorId;
    private String actorRole;  // AGENT, COURIER, CLIENT, etc.

    // ================== PROOF (SPEC SECTION 6) ==================
    private String proofUrl;
    private String comment;

    // ================== OFFLINE SYNC STATUS (SPEC SECTION 11) ==================
    private boolean synced;
}
