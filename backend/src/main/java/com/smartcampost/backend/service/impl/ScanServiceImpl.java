package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.ScanType;
import com.smartcampost.backend.exception.ScanException;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.service.ScanService;
import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.service.ScanEventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Objects;

@Service
public class ScanServiceImpl implements ScanService {

    private static final Logger log = LoggerFactory.getLogger(ScanServiceImpl.class);

    private final ScanEventRepository scanEventRepository;
    private final ScanEventService scanEventService;

    private final com.smartcampost.backend.sse.SseEmitters sseEmitters;

    public ScanServiceImpl(ScanEventRepository scanEventRepository,
                           ScanEventService scanEventService,
                           com.smartcampost.backend.sse.SseEmitters sseEmitters) {
        this.scanEventRepository = scanEventRepository;
        this.scanEventService = scanEventService;
        this.sseEmitters = sseEmitters;
    }

    @Override
    public ScanEvent recordScan(ScanEvent evt) {
        // Delegate to transactional method to ensure atomicity
        return recordScanTransactional(evt);
    }

    @Transactional
    public ScanEvent recordScanTransactional(ScanEvent evt) {
        Objects.requireNonNull(evt, "evt is required");
        java.util.UUID parcelId = Objects.requireNonNull(evt.getParcelId(), "parcelId is required");
        log.info("Recording scan for parcel {} by user {} role {} type {}", parcelId, evt.getScannedBy(), evt.getRole(), evt.getScanType());

        String role = evt.getRole() != null ? evt.getRole().toUpperCase() : "";
        boolean isAdmin = "ADMIN".equals(role);
        boolean canUpdate = isAdmin || role.equals("AGENT") || role.equals("COURIER") || role.equals("STAFF");

        // Clients may record tracking scans without GPS (legacy behavior)
        if (!canUpdate) {
            @SuppressWarnings("null")
            ScanEvent saved = scanEventRepository.save(evt);
            try {
                sseEmitters.emitScan(saved);
            } catch (Exception ex) {
                log.warn("Failed to emit scan event via SSE", ex);
            }
            return saved;
        }

        // For status-affecting scans: GPS is mandatory and status changes must go through ScanEventService
        if (evt.getLatitude() == null || evt.getLongitude() == null) {
            throw new ScanException("Location required: enable GPS");
        }

        String incoming = evt.getScanType();
        String mappedEventType;
        try {
            ScanType inType = ScanType.valueOf(incoming);
            switch (inType) {
                case PICKED_UP:
                    mappedEventType = "ACCEPTED";
                    break;
                case ARRIVED_AT_CENTER:
                    mappedEventType = "ARRIVED_HUB";
                    break;
                case IN_TRANSIT:
                    mappedEventType = "IN_TRANSIT";
                    break;
                case OUT_FOR_DELIVERY:
                    mappedEventType = "OUT_FOR_DELIVERY";
                    break;
                case DELIVERED:
                    mappedEventType = "DELIVERED";
                    break;
                case CLIENT_SCAN:
                default:
                    mappedEventType = "IN_TRANSIT";
                    break;
            }
        } catch (Exception ex) {
            mappedEventType = "IN_TRANSIT";
        }

        ScanEventCreateRequest req = new ScanEventCreateRequest();
        req.setParcelId(parcelId);
        req.setEventType(mappedEventType);
        req.setLatitude(evt.getLatitude());
        req.setLongitude(evt.getLongitude());
        req.setLocationSource(evt.getSource() != null ? evt.getSource() : "GPS");
        req.setLocationNote(evt.getAddress());
        req.setComment("LEGACY_SCAN:" + incoming);
        req.setActorRole(role);

        ScanEventResponse resp = scanEventService.recordScanEvent(req);
        java.util.UUID savedId = Objects.requireNonNull(resp.getId(), "scanEvent.id is required");
        ScanEvent saved = scanEventRepository.findById(savedId)
                .orElseThrow(() -> new IllegalStateException("Failed to load saved scan event"));

        try {
            sseEmitters.emitScan(saved);
        } catch (Exception ex) {
            log.warn("Failed to emit scan event via SSE", ex);
        }

        return saved;
    }

    @Override
    public List<ScanEvent> getScanEventsForParcel(java.util.UUID parcelId) {
        return scanEventRepository.findByParcel_IdOrderByTimestampAsc(parcelId);
    }
}
