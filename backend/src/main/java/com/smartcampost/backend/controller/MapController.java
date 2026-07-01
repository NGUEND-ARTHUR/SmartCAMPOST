package com.smartcampost.backend.controller;

import com.smartcampost.backend.model.Address;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PickupRequest;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.PickupRequestState;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PickupRequestRepository;
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
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

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
    private final PickupRequestRepository pickupRequestRepository;

    public MapController(
            ParcelRepository parcelRepository,
            ScanEventService scanEventService,
            LocationService locationService,
            ParcelAuthorizationService parcelAuthorizationService,
            UserAccountRepository userAccountRepository,
            AgentRepository agentRepository,
            CourierRepository courierRepository,
            PickupRequestRepository pickupRequestRepository
    ) {
        this.parcelRepository = parcelRepository;
        this.scanEventService = scanEventService;
        this.locationService = locationService;
        this.parcelAuthorizationService = parcelAuthorizationService;
        this.userAccountRepository = userAccountRepository;
        this.agentRepository = agentRepository;
        this.courierRepository = courierRepository;
        this.pickupRequestRepository = pickupRequestRepository;
    }

    @GetMapping("/parcels/{parcelId}")
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER','STAFF','ADMIN','RISK')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> parcelMap(@PathVariable String parcelId, Authentication authentication) {
        UUID pid;
        try { pid = UUID.fromString(parcelId); } catch (Exception e) { return ResponseEntity.badRequest().build(); }
        pid = Objects.requireNonNull(pid, "parcelId is required");
        parcelAuthorizationService.requireReadableParcel(pid, authentication);
        return parcelRepository.findById(pid)
                .map(p -> {
                    Map<String, Object> out = new HashMap<>();
                    out.put("parcelId", p.getId());
                    out.put("trackingNumber", p.getTrackingRef());
                    out.put("status", p.getStatus() != null ? p.getStatus().name() : null);
                    List<ScanEventResponse> events = scanEventService.getHistoryForParcel(p.getId());
                    out.put("timeline", events);

                    ScanEventResponse last = scanEventService.getLastScanEvent(p.getId());
                    if (last != null) {
                        Map<String, Object> loc = new HashMap<>();
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
    @Transactional(readOnly = true)
    public ResponseEntity<?> courierPersonalMap(java.security.Principal principal) {
        String uid = principal.getName();
        if (uid == null || uid.isBlank()) return ResponseEntity.badRequest().build();

        String actorId = resolveEntityId(uid);
        UUID actorAgencyId = resolveActorAgencyId(actorId);

        List<Location> locs = locationService.getRecentForUser(actorId);

        // Preload all PickupRequests in ASSIGNED state for this courier (avoids N+1)
        List<PickupRequest> assignedPickups = List.of();
        Set<UUID> assignedParcelIds = new HashSet<>();
        try {
            UUID courierId = UUID.fromString(actorId);
            assignedPickups = pickupRequestRepository.findByCourier_IdAndState(courierId, PickupRequestState.ASSIGNED);
            for (PickupRequest pr : assignedPickups) {
                if (pr.getParcel() != null) assignedParcelIds.add(pr.getParcel().getId());
            }
        } catch (IllegalArgumentException ignored) {}
        final Set<UUID> finalAssignedParcelIds = Collections.unmodifiableSet(assignedParcelIds);

        // Single pass: build activeParcels + deliveryStops simultaneously
        List<Map<String, Object>> activeParcels = new ArrayList<>();
        List<Map<String, Object>> deliveryStops = new ArrayList<>();

        parcelRepository.findByStatusIn(ACTIVE_STATUSES, PageRequest.of(0, 150))
                .stream()
                .filter(p -> isParcelVisibleToActor(p, actorId, actorAgencyId, finalAssignedParcelIds))
                .forEach(p -> {
                    ScanEventResponse last = scanEventService.getLastScanEvent(p.getId());

                    Map<String, Object> parcel = new LinkedHashMap<>();
                    parcel.put("id", p.getId());
                    parcel.put("trackingRef", p.getTrackingRef());
                    String status = p.getStatus() != null ? p.getStatus().name() : null;
                    parcel.put("status", status);
                    if (last != null && last.getLatitude() != null) {
                        parcel.put("currentLatitude", last.getLatitude());
                        parcel.put("currentLongitude", last.getLongitude());
                        parcel.put("currentTimestamp", last.getTimestamp());
                        parcel.put("currentEventType", last.getEventType());
                        parcel.put("locationNote", last.getLocationNote());
                    } else if (p.getCurrentLatitude() != null) {
                        parcel.put("currentLatitude", p.getCurrentLatitude());
                        parcel.put("currentLongitude", p.getCurrentLongitude());
                        parcel.put("currentTimestamp", p.getLocationUpdatedAt());
                    }
                    activeParcels.add(parcel);

                    // Delivery stop: parcel going to recipient / agency
                    if (p.getStatus() == ParcelStatus.OUT_FOR_DELIVERY) {
                        Map<String, Object> stop = buildDeliveryStop(p);
                        if (stop != null) deliveryStops.add(stop);
                    }
                });

        // Pickup stops: parcels the courier needs to collect at the sender's address
        List<Map<String, Object>> pickupStops = assignedPickups.stream()
                .filter(pr -> pr.getParcel() != null)
                .map(pr -> buildPickupStop(pr))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("locations", locs);
        out.put("activeParcels", activeParcels);
        out.put("pickupStops", pickupStops);
        out.put("deliveryStops", deliveryStops);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> adminOverview() {
        Map<String, Object> out = new HashMap<>();
        out.put("recentLocations", locationService.getRecentAll());

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

    // ─── helpers ────────────────────────────────────────────────────────────

    private Map<String, Object> buildPickupStop(PickupRequest pr) {
        Parcel p = pr.getParcel();
        if (p == null) return null;

        Map<String, Object> stop = new LinkedHashMap<>();
        stop.put("parcelId", p.getId());
        stop.put("trackingRef", p.getTrackingRef());
        stop.put("status", p.getStatus() != null ? p.getStatus().name() : null);
        stop.put("type", "PICKUP");
        stop.put("pickupRequestId", pr.getId());
        stop.put("requestedDate", pr.getRequestedDate() != null ? pr.getRequestedDate().toString() : null);
        stop.put("timeWindow", pr.getTimeWindow());

        Address addr = p.getSenderAddress();
        if (addr != null) {
            String addressText = addr.getStreet() != null
                    ? addr.getStreet() + ", " + addr.getCity()
                    : addr.getCity();
            stop.put("address", addressText);
            stop.put("city", addr.getCity());
            stop.put("country", addr.getCountry());
            if (addr.getLatitude() != null) stop.put("latitude", addr.getLatitude().doubleValue());
            if (addr.getLongitude() != null) stop.put("longitude", addr.getLongitude().doubleValue());
        }

        if (p.getClient() != null) {
            stop.put("contactName", p.getClient().getFullName());
            stop.put("contactPhone", p.getClient().getPhone());
        }
        return stop;
    }

    private Map<String, Object> buildDeliveryStop(Parcel p) {
        Map<String, Object> stop = new LinkedHashMap<>();
        stop.put("parcelId", p.getId());
        stop.put("trackingRef", p.getTrackingRef());
        stop.put("status", "OUT_FOR_DELIVERY");
        stop.put("type", "DELIVERY");
        stop.put("deliveryOption", p.getDeliveryOption() != null ? p.getDeliveryOption().name() : null);

        if (p.getDeliveryOption() == DeliveryOption.HOME && p.getRecipientAddress() != null) {
            Address addr = p.getRecipientAddress();
            String addressText = addr.getStreet() != null
                    ? addr.getStreet() + ", " + addr.getCity()
                    : addr.getCity();
            stop.put("address", addressText);
            stop.put("city", addr.getCity());
            stop.put("country", addr.getCountry());
            if (addr.getLatitude() != null) stop.put("latitude", addr.getLatitude().doubleValue());
            if (addr.getLongitude() != null) stop.put("longitude", addr.getLongitude().doubleValue());
        } else if (p.getDestinationAgency() != null) {
            Agency agency = p.getDestinationAgency();
            stop.put("address", agency.getAgencyName() + (agency.getCity() != null ? ", " + agency.getCity() : ""));
            stop.put("city", agency.getCity());
            stop.put("country", agency.getCountry());
        } else {
            return null; // no usable destination
        }
        return stop;
    }

    private String resolveEntityId(String principalName) {
        if (principalName == null) return "anonymous";

        Optional<UserAccount> byPhone = userAccountRepository.findByPhone(principalName);
        if (byPhone.isPresent() && byPhone.get().getEntityId() != null) {
            return byPhone.get().getEntityId().toString();
        }

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
     * A parcel is visible to an actor if:
     *   1. The parcel's most recent ScanEvent was performed by this actor, OR
     *   2. The parcel's originAgency matches the actor's agency, OR
     *   3. There is an ASSIGNED PickupRequest for this parcel with this courier.
     */
    private boolean isParcelVisibleToActor(Parcel p, String actorId, UUID actorAgencyId, Set<UUID> assignedParcelIds) {
        if (assignedParcelIds.contains(p.getId())) return true;

        ScanEventResponse last = scanEventService.getLastScanEvent(p.getId());
        if (last != null && actorId.equals(last.getActorId())) return true;

        if (actorAgencyId != null && p.getOriginAgency() != null
                && actorAgencyId.equals(p.getOriginAgency().getId())) return true;

        return false;
    }

    private UUID resolveActorAgencyId(String actorKey) {
        try {
            UUID entityId = UUID.fromString(actorKey);
            return agentRepository.findById(entityId)
                    .map(agent -> agent.getAgency() != null ? agent.getAgency().getId() : null)
                    .orElseGet(() ->
                        courierRepository.findById(entityId)
                                .map(courier -> courier.getAgency() != null ? courier.getAgency().getId() : null)
                                .orElse(null)
                    );
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
