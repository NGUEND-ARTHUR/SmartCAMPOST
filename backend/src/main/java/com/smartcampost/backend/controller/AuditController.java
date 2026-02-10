package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.audit.AuditRecord;
import com.smartcampost.backend.dto.audit.ParcelAuditResponse;
import com.smartcampost.backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for audit and accountability.
 * Admin-only access to full audit trails.
 */
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    /**
     * Get complete audit trail for a parcel.
     * Shows: who handled it, when, where, which action.
     */
    @GetMapping("/parcel/{parcelId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'RISK')")
    public ResponseEntity<ParcelAuditResponse> getParcelAuditTrail(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(auditService.getParcelAuditTrail(parcelId));
    }

    /**
     * Get audit records for a specific actor (agent, courier, etc.)
     */
    @GetMapping("/actor/{actorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK')")
    public ResponseEntity<List<AuditRecord>> getAuditByActor(
            @PathVariable String actorId
    ) {
        return ResponseEntity.ok(auditService.getAuditByActor(actorId));
    }

    /**
     * Get audit records for a specific agency
     */
    @GetMapping("/agency/{agencyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK')")
    public ResponseEntity<List<AuditRecord>> getAuditByAgency(
            @PathVariable UUID agencyId
    ) {
        return ResponseEntity.ok(auditService.getAuditByAgency(agencyId));
    }
}
