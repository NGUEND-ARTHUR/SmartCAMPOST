package com.smartcampost.backend.dto.audit;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * Audit record for tracking all actions on a parcel.
 * Provides full accountability: who, when, where, what.
 */
@Data
@Builder
public class AuditRecord {
    private String recordId;
    private String parcelId;
    private String trackingRef;
    
    // Who
    private String actorId;
    private String actorRole;
    private String actorName;
    
    // When
    private Instant timestamp;
    private Instant deviceTimestamp;
    
    // Where
    private Double latitude;
    private Double longitude;
    private String locationNote;
    private String locationSource;
    
    // What
    private String action;
    private String eventType;
    private String previousStatus;
    private String newStatus;
    private String comment;
    private String proofUrl;
    
    // Agency context
    private String agencyId;
    private String agencyName;
}
