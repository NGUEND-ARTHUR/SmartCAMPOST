package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.ScanType;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.exception.ScanException;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.service.ScanService;
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
    private final ParcelRepository parcelRepository;

    private final com.smartcampost.backend.sse.SseEmitters sseEmitters;

    public ScanServiceImpl(ScanEventRepository scanEventRepository, ParcelRepository parcelRepository, com.smartcampost.backend.sse.SseEmitters sseEmitters) {
        this.scanEventRepository = scanEventRepository;
        this.parcelRepository = parcelRepository;
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

        // persist event
        ScanEvent saved = Objects.requireNonNull(scanEventRepository.save(evt), "failed to save scan event");

        // If scan doesn't contain coordinates, do not accept unless source=MANUAL with address
        if ((evt.getLatitude() == null || evt.getLongitude() == null) && (evt.getAddress() == null || evt.getAddress().isBlank())) {
            log.warn("Scan event {} missing location data", saved.getEventId());
            throw new ScanException("Location required: enable GPS or provide manual address");
        }

        // Update parcel status only for roles allowed
        String role = evt.getRole() != null ? evt.getRole().toUpperCase() : "";
        boolean isAdmin = "ADMIN".equals(role);
        boolean canUpdate = isAdmin || role.equals("AGENT") || role.equals("COURIER") || role.equals("STAFF");

        if (canUpdate) {
            parcelRepository.findById(parcelId).ifPresent(parcel -> {
                    ParcelStatus currentStatus = parcel.getStatus();
                    String current = mapParcelStatusToScanType(currentStatus).name();
                    String incoming = evt.getScanType();
                    try {
                        if (isValidTransition(current, incoming) || isAdmin) {
                            // Map incoming scan type back to a parcel status when possible
                            try {
                                ScanType inType = ScanType.valueOf(incoming);
                                // best-effort mapping
                                switch (inType) {
                                    case PICKED_UP:
                                        parcel.setStatus(ParcelStatus.ACCEPTED);
                                        break;
                                    case ARRIVED_AT_CENTER:
                                        parcel.setStatus(ParcelStatus.ARRIVED_HUB);
                                        break;
                                    case IN_TRANSIT:
                                        parcel.setStatus(ParcelStatus.IN_TRANSIT);
                                        break;
                                    case OUT_FOR_DELIVERY:
                                        parcel.setStatus(ParcelStatus.OUT_FOR_DELIVERY);
                                        break;
                                    case DELIVERED:
                                        parcel.setStatus(ParcelStatus.DELIVERED);
                                        break;
                                    default:
                                        // no change for unknown
                                        break;
                                }
                            } catch (IllegalArgumentException ex) {
                                // incoming not a known ScanType – ignore mapping
                            }
                            parcelRepository.save(parcel);
                            log.info("Parcel {} status updated {} -> {} by {}", parcel.getId(), current, incoming, evt.getScannedBy());
                        } else {
                            log.warn("Invalid status transition for parcel {}: {} -> {}", parcel.getId(), current, incoming);
                            throw new ScanException("Invalid status transition");
                        }
                    } catch (ScanException e) {
                        // rethrow to trigger rollback
                        throw e;
                    }
                });
        } else {
            log.info("Role {} not permitted to change parcel status; recorded scan only", role);
        }

        // broadcast scan event to SSE subscribers (best-effort)
        try {
            sseEmitters.emitScan(saved);
        } catch (Exception ex) {
            log.warn("Failed to emit scan event via SSE", ex);
        }

        return saved;
    }

    private boolean isValidTransition(String current, String incoming) {
        if (current == null) return true;
        if (current.equalsIgnoreCase(incoming)) return true;
        // Define allowed forward transitions
        try {
            ScanType in = ScanType.valueOf(incoming);
            ScanType cur = ScanType.valueOf(current);
            switch (cur) {
                case PICKED_UP:
                    return in == ScanType.IN_TRANSIT || in == ScanType.ARRIVED_AT_CENTER || in == ScanType.OUT_FOR_DELIVERY || in == ScanType.DELIVERED;
                case ARRIVED_AT_CENTER:
                    return in == ScanType.IN_TRANSIT || in == ScanType.OUT_FOR_DELIVERY || in == ScanType.DELIVERED;
                case IN_TRANSIT:
                    return in == ScanType.OUT_FOR_DELIVERY || in == ScanType.DELIVERED;
                case OUT_FOR_DELIVERY:
                    return in == ScanType.DELIVERED;
                case DELIVERED:
                    return false; // Delivered is terminal
                default:
                    return true;
            }
        } catch (IllegalArgumentException ex) {
            // Unknown types: allow only non-regressive when admin will manage
            return false;
        }
    }

    private ScanType mapParcelStatusToScanType(ParcelStatus st) {
        if (st == null) return ScanType.IN_TRANSIT;
        switch (st) {
            case CREATED:
            case ACCEPTED:
                return ScanType.PICKED_UP;
            case ARRIVED_HUB:
                return ScanType.ARRIVED_AT_CENTER;
            case IN_TRANSIT:
                return ScanType.IN_TRANSIT;
            case OUT_FOR_DELIVERY:
                return ScanType.OUT_FOR_DELIVERY;
            case DELIVERED:
            case RETURNED:
                return ScanType.DELIVERED;
            default:
                return ScanType.IN_TRANSIT;
        }
    }

    @Override
    public List<ScanEvent> getScanEventsForParcel(java.util.UUID parcelId) {
        return scanEventRepository.findByParcel_IdOrderByTimestampAsc(parcelId);
    }
}
