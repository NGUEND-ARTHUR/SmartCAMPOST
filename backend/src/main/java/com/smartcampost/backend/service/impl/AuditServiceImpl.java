package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.audit.AuditRecord;
import com.smartcampost.backend.dto.audit.ParcelAuditResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of AuditService.
 * ScanEvent is the single source of truth for audit.
 */
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final ParcelRepository parcelRepository;
    private final ScanEventRepository scanEventRepository;

    @Override
    public ParcelAuditResponse getParcelAuditTrail(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");

        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        List<ScanEvent> events = scanEventRepository
                .findByParcel_IdOrderByTimestampAsc(parcelId);

        List<AuditRecord> auditTrail = events.stream()
                .map(this::toAuditRecord)
                .collect(Collectors.toList());

        return ParcelAuditResponse.builder()
                .parcelId(parcel.getId().toString())
                .trackingRef(parcel.getTrackingRef())
                .currentStatus(parcel.getStatus().name())
                .createdAt(parcel.getCreatedAt())
                .auditTrail(auditTrail)
                .totalEvents(auditTrail.size())
                .build();
    }

    @Override
    public List<AuditRecord> getAuditByActor(String actorId) {
        Objects.requireNonNull(actorId, "actorId is required");

        return scanEventRepository.findByActorIdOrderByTimestampDesc(actorId)
                .stream()
                .map(this::toAuditRecord)
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditRecord> getAuditByAgency(UUID agencyId) {
        Objects.requireNonNull(agencyId, "agencyId is required");

        return scanEventRepository.findByAgency_IdOrderByTimestampDesc(agencyId)
                .stream()
                .map(this::toAuditRecord)
                .collect(Collectors.toList());
    }

    private AuditRecord toAuditRecord(ScanEvent event) {
        return AuditRecord.builder()
                .recordId(event.getId().toString())
                .parcelId(event.getParcel().getId().toString())
                .trackingRef(event.getParcel().getTrackingRef())
                .actorId(event.getActorId() != null ? event.getActorId() : event.getScannedBy())
                .actorRole(event.getActorRole() != null ? event.getActorRole() : event.getRole())
                .actorName(event.getAgent() != null ? event.getAgent().getFullName() : null)
                .timestamp(event.getTimestamp())
                .deviceTimestamp(event.getDeviceTimestamp())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .locationNote(event.getLocationNote())
                .locationSource(event.getLocationSource() != null ? event.getLocationSource().name() : null)
                .action(event.getEventType().name())
                .eventType(event.getEventType().name())
                .comment(event.getComment())
                .proofUrl(event.getProofUrl())
                .agencyId(event.getAgency() != null ? event.getAgency().getId().toString() : null)
                .agencyName(event.getAgency() != null ? event.getAgency().getAgencyName() : null)
                .build();
    }
}
