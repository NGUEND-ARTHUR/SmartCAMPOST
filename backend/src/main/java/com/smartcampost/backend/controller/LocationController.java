package com.smartcampost.backend.controller;

import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) { this.locationService = locationService; }

    @PostMapping("/update")
    @PreAuthorize("hasAnyRole('COURIER','AGENT')")
    public ResponseEntity<Location> updateLocation(@RequestBody Location loc, Principal principal) {
        // Try to attach user id from principal
        try { loc.setUserId(Long.parseLong(principal.getName())); } catch (Exception ignored) {}
        if (loc.getSource() == null) loc.setSource(loc.getLatitude() != null ? "GPS" : "MANUAL");
        Location saved = locationService.saveLocation(loc);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('COURIER','AGENT')")
    public ResponseEntity<List<Location>> myRecent(Principal principal) {
        Long uid = null;
        try { uid = Long.parseLong(principal.getName()); } catch (Exception ignored) {}
        if (uid == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(locationService.getRecentForUser(uid));
    }

}
