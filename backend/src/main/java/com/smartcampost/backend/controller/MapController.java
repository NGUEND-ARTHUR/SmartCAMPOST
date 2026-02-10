package com.smartcampost.backend.controller;

import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.LocationService;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.service.ScanEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/map")
public class MapController {

    private final ParcelRepository parcelRepository;
    private final ScanEventService scanEventService;
    private final LocationService locationService;

    public MapController(ParcelRepository parcelRepository, ScanEventService scanEventService, LocationService locationService) {
        this.parcelRepository = parcelRepository;
        this.scanEventService = scanEventService;
        this.locationService = locationService;
    }

    @GetMapping("/parcels/{parcelId}")
    public ResponseEntity<?> parcelMap(@PathVariable String parcelId) {
        java.util.UUID pid;
        try { pid = java.util.UUID.fromString(parcelId); } catch (Exception e) { return ResponseEntity.badRequest().build(); }
        pid = Objects.requireNonNull(pid, "parcelId is required");
        return parcelRepository.findById(pid)
                .map(p -> {
                    Map<String, Object> out = new HashMap<>();
                    out.put("parcelId", p.getId());
                    out.put("trackingNumber", p.getTrackingRef());
                    out.put("status", p.getStatus() != null ? p.getStatus().name() : null);
                    // ScanEvent is the single source of truth for parcel movement.
                    List<ScanEventResponse> events = scanEventService.getHistoryForParcel(p.getId());
                    out.put("timeline", events);

                    ScanEventResponse last = scanEventService.getLastScanEvent(p.getId());
                    if (last != null) {
                        Map<String,Object> loc = new HashMap<>();
                        loc.put("note", last.getLocationNote());
                        loc.put("eventId", last.getId());
                        loc.put("timestamp", last.getTimestamp());
                        loc.put("latitude", last.getLatitude());
                        loc.put("longitude", last.getLongitude());
                        out.put("currentLocation", loc);
                    }
                    return ResponseEntity.ok(out);
                }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/couriers/me")
    @PreAuthorize("hasAnyRole('COURIER','AGENT')")
    public ResponseEntity<?> courierPersonalMap(java.security.Principal principal) {
        Long uid = null;
        try { uid = Long.parseLong(principal.getName()); } catch (Exception ignored) {}
        if (uid == null) return ResponseEntity.badRequest().build();
        List<Location> locs = locationService.getRecentForUser(uid);
        Map<String, Object> out = new HashMap<>();
        out.put("locations", locs);
        // assigned parcels - best-effort: find parcels assigned to this courier if such field exists
        // For now return only locations
        return ResponseEntity.ok(out);
    }

    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> adminOverview() {
        Map<String, Object> out = new HashMap<>();
        out.put("recentLocations", locationService.getRecentAll());
        // active parcels: minimal list
        out.put("activeParcels", parcelRepository.findAll());
        return ResponseEntity.ok(out);
    }
}
