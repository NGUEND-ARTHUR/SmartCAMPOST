package com.smartcampost.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.dto.TrackingResponse;
import com.smartcampost.backend.dto.TrackingQrRequest;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.dto.qr.QrVerificationResponse;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.service.QrSecurityService;
import com.smartcampost.backend.service.ScanEventService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/track")
public class TrackingController {

    private final ParcelRepository parcelRepository;
    private final ScanEventService scanEventService;
    private final ScanEventRepository scanEventRepository;
    private final QrSecurityService qrSecurityService;
    private final ObjectMapper objectMapper;

    public TrackingController(
            ParcelRepository parcelRepository,
            ScanEventService scanEventService,
            ScanEventRepository scanEventRepository,
            QrSecurityService qrSecurityService,
            ObjectMapper objectMapper
    ) {
        this.parcelRepository = parcelRepository;
        this.scanEventService = scanEventService;
        this.scanEventRepository = scanEventRepository;
        this.qrSecurityService = qrSecurityService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/parcel/{trackingNumber}")
    public ResponseEntity<TrackingResponse> trackByNumber(@PathVariable String trackingNumber) {
        return parcelRepository.findByTrackingRef(trackingNumber)
                .map(p -> {
                    TrackingResponse r = new TrackingResponse();
                    r.parcelId = p.getId() != null ? p.getId().toString() : null;
                    r.trackingRef = p.getTrackingRef();
                    r.trackingNumber = p.getTrackingRef();
                    r.status = p.getStatus() != null ? p.getStatus().name() : null;

                    List<ScanEventResponse> events = getTimelineForRequest(p);
                    ScanEventResponse last = events.isEmpty() ? null : events.get(events.size() - 1);
                    r.lastLocationNote = last != null ? last.getLocationNote() : null;

                    if (last != null && last.getLatitude() != null && last.getLongitude() != null) {
                        TrackingResponse.CurrentLocation loc = new TrackingResponse.CurrentLocation();
                        loc.latitude = last.getLatitude();
                        loc.longitude = last.getLongitude();
                        loc.locationSource = last.getLocationSource() != null ? last.getLocationSource().toString() : null;
                        loc.eventType = last.getEventType();
                        loc.updatedAt = last.getTimestamp() != null
                                ? OffsetDateTime.ofInstant(last.getTimestamp(), ZoneOffset.UTC)
                                : null;
                        r.currentLocation = loc;
                    }

                    r.updatedAt = last != null && last.getTimestamp() != null
                            ? OffsetDateTime.ofInstant(last.getTimestamp(), ZoneOffset.UTC)
                            : null;
                    r.timeline = List.copyOf(events);
                    return ResponseEntity.ok(r);
                }).orElse(ResponseEntity.notFound().build());
    }

    private boolean isAuthenticatedRequest() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        if (!auth.isAuthenticated()) return false;
        Object principal = auth.getPrincipal();
        if (principal == null) return false;
        return !"anonymousUser".equals(principal);
    }

    private List<ScanEventResponse> getTimelineForRequest(Parcel parcel) {
        if (parcel == null || parcel.getId() == null) {
            return List.of();
        }

        // Authenticated users keep the strict access control and full audit timeline
        if (isAuthenticatedRequest()) {
            return scanEventService.getHistoryForParcel(parcel.getId());
        }

        // Public tracking: GPS-only journey, no actor/proof/audit fields.
        List<ScanEvent> events = scanEventRepository.findByParcel_IdOrderByTimestampAsc(parcel.getId());
        return events.stream().map(this::toPublicScanEventResponse).toList();
    }

    private ScanEventResponse toPublicScanEventResponse(ScanEvent event) {
        if (event == null) return null;

        Parcel parcel = event.getParcel();
        Agency agency = event.getAgency();

        return ScanEventResponse.builder()
                .id(event.getId())
                .parcelId(parcel != null ? parcel.getId() : null)
                .trackingRef(parcel != null ? parcel.getTrackingRef() : null)
                .agencyId(agency != null ? agency.getId() : null)
                .agencyName(agency != null ? agency.getAgencyName() : null)
                .agentId(null)
                .agentName(null)
                .eventType(event.getEventType() != null ? event.getEventType().name() : null)
                .timestamp(event.getTimestamp())
                .locationNote(event.getLocationNote())
                .parcelStatusAfter(parcel != null ? parcel.getStatus() : null)
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .locationSource(event.getLocationSource() != null ? event.getLocationSource().name() : null)
                .actorId(null)
                .actorRole(null)
                .proofUrl(null)
                .comment(null)
                .synced(event.isSynced())
                .build();
    }

    @GetMapping("/qr/{code}")
    public ResponseEntity<TrackingResponse> trackByQr(@PathVariable String code, HttpServletRequest request) {
        return trackByQrInternal(code, request);
    }

    /**
     * Track by raw scanned QR content.
     * Supports:
     * - FINAL secure payload: V1|P|TOKEN|REF|TS|SIG (verified server-side)
     * - PARTIAL JSON payload: { type: "SMARTCAMPOST_PARCEL", trackingRef, parcelId? }
     * - Plain tracking reference
     */
    @PostMapping("/qr")
    public ResponseEntity<TrackingResponse> trackByQrPost(
            @Valid @RequestBody TrackingQrRequest body,
            HttpServletRequest request
    ) {
        return trackByQrInternal(body.code, request);
    }

    private ResponseEntity<TrackingResponse> trackByQrInternal(String rawCode, HttpServletRequest request) {
        if (rawCode == null || rawCode.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String code = rawCode.trim();

        // 1) Secure FINAL QR: verify anti-forgery and extract trackingRef
        if (code.startsWith("V1|")) {
            String ip = request != null ? request.getRemoteAddr() : null;
            String ua = request != null ? request.getHeader("User-Agent") : null;
            QrVerificationResponse verification = qrSecurityService.verifyQrCodeContent(code, ip, ua);
            if (verification == null || verification.getStatus() == null) {
                return ResponseEntity.badRequest().build();
            }
            if (verification.getStatus() != QrVerificationResponse.VerificationStatus.VALID) {
                // Not a valid/authorized secure code (includes PARCEL_NOT_VALIDATED)
                return ResponseEntity.status(422).build();
            }
            String trackingRef = verification.getTrackingRef();
            if (trackingRef == null || trackingRef.isBlank()) {
                return ResponseEntity.badRequest().build();
            }
            return trackByNumber(trackingRef);
        }

        // 2) PARTIAL JSON QR: extract trackingRef
        if (code.startsWith("{")) {
            try {
                JsonNode node = objectMapper.readTree(code);
                JsonNode tracking = node.get("trackingRef");
                if (tracking != null && !tracking.asText().isBlank()) {
                    return trackByNumber(tracking.asText());
                }
            } catch (Exception ignored) {
                // fall through
            }
        }

        // 3) Plain tracking reference
        return trackByNumber(code);
    }
}
