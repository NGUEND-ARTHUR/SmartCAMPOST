package com.smartcampost.backend.controller;

import com.smartcampost.backend.model.Agent;
import com.smartcampost.backend.model.Courier;
import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.security.ParcelAuthorizationService;
import com.smartcampost.backend.service.LocationService;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.service.ScanEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.data.domain.PageRequest;
import java.util.*;

@RestController
@RequestMapping("/api/map")
public class MapController {

    private static final List<ParcelStatus> ACTIVE_STATUSES = List.of(
            ParcelStatus.CREATED, ParcelStatus.ACCEPTED, ParcelStatus.TAKEN_IN_CHARGE,
            ParcelStatus.IN_TRANSIT, ParcelStatus.ARRIVED_HUB, ParcelStatus.ARRIVED_DEST_AGENCY,
            ParcelStatus.OUT_FOR_DELIVERY
    );

    private final ParcelRepository parcelRepository;
    private final ScanEventService scanEventService;
    private final LocationService locationService;
    private final ParcelAuthorizationService parcelAuthorizationService;
    private final UserAccountRepository userAccountRepository;
    private final AgentRepository agentRepository;
    private final CourierRepository courierRepository;

    public MapController(
            ParcelRepository parcelRepository,
            ScanEventService scanEventService,
            LocationService locationService,
            ParcelAuthorizationService parcelAuthorizationService,
            UserAccountRepository userAccountRepository,
            AgentRepository agentRepository,
            CourierRepository courierRepository
    ) {
        this.parcelRepository = parcelRepository;
        this.scanEventService = scanEventService;
        this.locationService = locationService;
        this.parcelAuthorizationService = parcelAuthorizationService;
        this.userAccountRepository = userAccountRepository;
        this.agentRepository = agentRepository;
        this.courierRepository = courierRepository;
    }

    @GetMapping("/parcels/{parcelId}")
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER','STAFF','ADMIN','RISK')")
    public ResponseEntity<?> parcelMap(@PathVariable String parcelId, Authentication authentication) {
        java.util.UUID pid;
        try { pid = java.util.UUID.fromString(parcelId); } catch (Exception e) { return ResponseEntity.badRequest().build(); }
        pid = Objects.requireNonNull(pid, "parcelId is required");
        parcelAuthorizationService.requireReadableParcel(pid, authentication);
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
        String uid = principal.getName();
        if (uid == null || uid.isBlank()) return ResponseEntity.badRequest().build();

        // Resolve the principal to entityId (Courier/Agent ID) so it matches ScanEvent.actorId
        String actorId = resolveEntityId(uid);
        UUID actorAgencyId = resolveActorAgencyId(actorId);

        List<Location> locs = locationService.getRecentForUser(actorId);

        // SECURITY FIX: Only return parcels where the last scan event's actorId matches
        // this user, or the parcel's origin agency matches the user's agency.
        List<Map<String, Object>> activeParcels = parcelRepository
                .findByStatusIn(ACTIVE_STATUSES, PageRequest.of(0, 150))
                .stream()
                .filter(p -> isParcelVisibleToActor(p, actorId, actorAgencyId))
                .map(p -> {
                    ScanEventResponse last = scanEventService.getLastScanEvent(p.getId());

                    Map<String, Object> parcel = new HashMap<>();
                    parcel.put("id", p.getId());
                    parcel.put("trackingRef", p.getTrackingRef());
                    parcel.put("status", p.getStatus() != null ? p.getStatus().name() : null);
                    if (last != null) {
                        parcel.put("currentLatitude", last.getLatitude());
                        parcel.put("currentLongitude", last.getLongitude());
                        parcel.put("currentTimestamp", last.getTimestamp());
                        parcel.put("currentEventType", last.getEventType());
                        parcel.put("locationNote", last.getLocationNote());
                    } else if (p.getCurrentLatitude() != null && p.getCurrentLongitude() != null) {
                        parcel.put("currentLatitude", p.getCurrentLatitude());
                        parcel.put("currentLongitude", p.getCurrentLongitude());
                        parcel.put("currentTimestamp", p.getLocationUpdatedAt());
                    }
                    return parcel;
                })
                .limit(150)
                .toList();

        Map<String, Object> out = new HashMap<>();
        out.put("locations", locs);
        out.put("activeParcels", activeParcels);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> adminOverview() {
        Map<String, Object> out = new HashMap<>();
        out.put("recentLocations", locationService.getRecentAll());

        // ✅ FIX: Use paginated query for admin overview - prevents memory bomb
        List<Map<String, Object>> activeParcels = parcelRepository
                .findByStatusIn(ACTIVE_STATUSES, PageRequest.of(0, 300))
                .stream()
                .map(p -> {
                    Map<String, Object> parcel = new HashMap<>();
                    parcel.put("id", p.getId());
                    parcel.put("trackingRef", p.getTrackingRef());
                    parcel.put("status", p.getStatus() != null ? p.getStatus().name() : null);
                    parcel.put("creationLatitude", p.getCreationLatitude());
                    parcel.put("creationLongitude", p.getCreationLongitude());

                    // Use denormalized current location if available, fallback to last scan event
                    if (p.getCurrentLatitude() != null && p.getCurrentLongitude() != null) {
                        parcel.put("currentLatitude", p.getCurrentLatitude());
                        parcel.put("currentLongitude", p.getCurrentLongitude());
                        parcel.put("currentTimestamp", p.getLocationUpdatedAt());
                    } else {
                        ScanEventResponse last = scanEventService.getLastScanEvent(p.getId());
                        if (last != null) {
                            parcel.put("currentLatitude", last.getLatitude());
                            parcel.put("currentLongitude", last.getLongitude());
                            parcel.put("currentTimestamp", last.getTimestamp());
                            parcel.put("currentEventType", last.getEventType());
                        }
                    }
                    return parcel;
                })
                .toList();

        out.put("activeParcels", activeParcels);
        return ResponseEntity.ok(out);
    }

    /**
     * Resolves the authentication principal name to the entityId used as actorId in ScanEvents.
     */
    private String resolveEntityId(String principalName) {
        if (principalName == null) return "anonymous";

        // Try phone lookup first
        Optional<UserAccount> byPhone = userAccountRepository.findByPhone(principalName);
        if (byPhone.isPresent() && byPhone.get().getEntityId() != null) {
            return byPhone.get().getEntityId().toString();
        }

        // JWT subject is UserAccount.id (UUID) — resolve to entityId (Courier/Agent ID)
        try {
            UUID userAccountId = UUID.fromString(principalName);
            Optional<UserAccount> byId = userAccountRepository.findById(userAccountId);
            if (byId.isPresent() && byId.get().getEntityId() != null) {
                return byId.get().getEntityId().toString();
            }
        } catch (IllegalArgumentException ignored) {}

        return principalName;
    }

    /**
     * Determines whether a parcel should be visible to the given actor.
     * A parcel is visible if:
     *   1. The parcel's most recent ScanEvent.actorId matches the actor's key, OR
     *   2. The parcel's originAgency matches the actor's agency.
     */
    private boolean isParcelVisibleToActor(Parcel p, String actorId, UUID actorAgencyId) {
        // Check if the last scan event for this parcel was performed by this actor
        ScanEventResponse last = scanEventService.getLastScanEvent(p.getId());
        if (last != null && actorId.equals(last.getActorId())) {
            return true;
        }

        // Check if the parcel's origin agency matches the actor's agency
        if (actorAgencyId != null && p.getOriginAgency() != null
                && actorAgencyId.equals(p.getOriginAgency().getId())) {
            return true;
        }

        return false;
    }

    /**
     * Resolves the agency ID for a COURIER or AGENT entity.
     */
    private UUID resolveActorAgencyId(String actorKey) {
        try {
            UUID entityId = UUID.fromString(actorKey);

            // Try as Agent first
            return agentRepository.findById(entityId)
                    .map(agent -> agent.getAgency() != null ? agent.getAgency().getId() : null)
                    .orElseGet(() ->
                        // Try as Courier
                        courierRepository.findById(entityId)
                                .map(courier -> courier.getAgency() != null ? courier.getAgency().getId() : null)
                                .orElse(null)
                    );
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
