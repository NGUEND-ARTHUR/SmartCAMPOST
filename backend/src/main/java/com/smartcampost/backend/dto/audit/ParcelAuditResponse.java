package com.smartcampost.backend.dto.audit;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

/**
 * Full audit trail for a parcel.
 */
@Data
@Builder
public class ParcelAuditResponse {
    private String parcelId;
    private String trackingRef;
    private String currentStatus;
    private Instant createdAt;
    private List<AuditRecord> auditTrail;
    private int totalEvents;
}
