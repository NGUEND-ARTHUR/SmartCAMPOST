package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.audit.AuditRecord;
import com.smartcampost.backend.dto.audit.ParcelAuditResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service for audit and accountability.
 * Provides full traceability of all parcel actions.
 */
public interface AuditService {

    /**
     * Get complete audit trail for a parcel.
     * Shows: who handled it, when, where, which action.
     */
    ParcelAuditResponse getParcelAuditTrail(UUID parcelId);

    /**
     * Get audit records for a specific actor.
     */
    List<AuditRecord> getAuditByActor(String actorId);

    /**
     * Get audit records for a specific agency.
     */
    List<AuditRecord> getAuditByAgency(UUID agencyId);
}
