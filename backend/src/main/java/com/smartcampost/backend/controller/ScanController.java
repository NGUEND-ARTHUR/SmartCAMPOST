package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.ScanType;
import com.smartcampost.backend.service.ScanEventService;
import com.smartcampost.backend.service.ScanService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parcels")
public class ScanController {

    private final ScanService scanService;
    private final ScanEventService scanEventService;

    public ScanController(ScanService scanService, ScanEventService scanEventService) {
        this.scanService = scanService;
        this.scanEventService = scanEventService;
    }

    @GetMapping("/{parcelId}/scan-events")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('CLIENT')")
    public ResponseEntity<List<ScanEventResponse>> getScanEvents(@PathVariable String parcelId, Principal principal) {
        try {
            java.util.UUID pid = java.util.UUID.fromString(parcelId);
            return ResponseEntity.ok(scanEventService.getHistoryForParcel(pid));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping("/{parcelId}/scan")
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER','STAFF','ADMIN')")
    public ResponseEntity<?> postScan(@PathVariable String parcelId, @RequestBody ScanEvent evt) {
        // Attach parcel and user
        try { evt.setParcelId(java.util.UUID.fromString(parcelId)); } catch (Exception ignored) {}
        // Resolve authentication from SecurityContext so tests work whether filters are active
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        try { if (auth != null) evt.setScannedBy(auth.getName()); } catch (Exception ignored) {}

        // Derive role from authentication authorities; prefer first matching role
        String role = "CLIENT";
        if (auth != null) {
            role = auth.getAuthorities().stream().map(a -> a.getAuthority().replace("ROLE_", "")).findFirst().orElse("CLIENT");
        }
        evt.setRole(role);

        // GPS-first: require lat/lng when possible
        if (evt.getLatitude() == null || evt.getLongitude() == null) {
            // If client skipped GPS, allow only tracking (CLIENT_SCAN)
            if ("CLIENT".equalsIgnoreCase(role)) {
                evt.setSource("MANUAL");
                evt.setScanType(ScanType.CLIENT_SCAN.name());
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Location required: enable GPS or provide manual address"));
            }
        } else {
            evt.setSource("GPS");
        }

        try {
            ScanEvent saved = scanService.recordScan(evt);
            // return concise response
            return ResponseEntity.ok(Map.of("eventId", saved.getId(), "status", "ok"));
        } catch (com.smartcampost.backend.exception.ScanException e) {
            return ResponseEntity.status(422).body(Map.of("error", e.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "Server error processing scan"));
        }
    }

    
}
