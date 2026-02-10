package com.smartcampost.backend.dto.scan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Request to create a ScanEvent.
 * GPS coordinates are MANDATORY for all scan events.
 */
@Data
public class ScanEventCreateRequest {

    /**
     * Local ID for offline sync correlation.
     * Assigned by client, used to match sync responses.
     */
    private String localId;

    @NotNull(message = "parcelId is required")
    private UUID parcelId;

    private UUID agencyId;

    private UUID agentId;

    /**
     * Type of event: ACCEPTED, TAKEN_IN_CHARGE, IN_TRANSIT, ARRIVED_DEST_AGENCY,
     * OUT_FOR_DELIVERY, DELIVERED, PICKED_UP_AT_AGENCY, etc.
     */
    @NotBlank(message = "eventType is required")
    private String eventType;

    // MANDATORY GPS FIELDS
    @NotNull(message = "latitude is required - GPS must be enabled")
    private Double latitude;

    @NotNull(message = "longitude is required - GPS must be enabled")
    private Double longitude;

    /**
     * Source of location: GPS, CELL, MANUAL, WIFI
     */
    private String locationSource = "GPS";

    /**
     * Device timestamp for offline events ordering
     */
    private Instant deviceTimestamp;

    private String locationNote;

    /**
     * URL to proof image/document
     */
    private String proofUrl;

    /**
     * Free-text comment by actor
     */
    private String comment;

    // ================== ACTOR INFO (SPEC SECTION 12) ==================
    /**
     * ID of the actor performing this action (agent, courier, etc.)
     */
    private UUID actorId;

    /**
     * Role of the actor: AGENT, COURIER, CLIENT, ADMIN
     */
    private String actorRole;
}
