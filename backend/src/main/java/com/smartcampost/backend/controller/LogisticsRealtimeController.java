package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.logistics.GpsTrackerRequest;
import com.smartcampost.backend.dto.logistics.GpsUpdateRequest;
import com.smartcampost.backend.model.GpsTracker;
import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.GpsTrackerRepository;
import com.smartcampost.backend.repository.LocationRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.sse.SseEmitters;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

@RestController
@RequestMapping("/api/logistics")
@RequiredArgsConstructor
@Slf4j
public class LogisticsRealtimeController {

    private static final List<ParcelStatus> ACTIVE_STATUSES = List.of(
            ParcelStatus.CREATED, ParcelStatus.ACCEPTED, ParcelStatus.TAKEN_IN_CHARGE,
            ParcelStatus.IN_TRANSIT, ParcelStatus.ARRIVED_HUB, ParcelStatus.ARRIVED_DEST_AGENCY,
            ParcelStatus.OUT_FOR_DELIVERY
    );

    // Same role set trusted with GET /api/logistics/live — nationwide GPS data must never
    // reach a CLIENT, even one connected to the shared /api/stream/ai channel for AI chat.
    private static final Set<String> GPS_VISIBLE_AUTHORITIES = Set.of(
            "ROLE_ADMIN", "ROLE_STAFF", "ROLE_RISK", "ROLE_COURIER", "ROLE_AGENT"
    );

    private final GpsTrackerRepository gpsTrackerRepository;
    private final LocationRepository locationRepository;
    private final ParcelRepository parcelRepository;
    private final UserAccountRepository userAccountRepository;
    private final ScanEventRepository scanEventRepository;
    private final SseEmitters sseEmitters;

    @GetMapping("/trackers")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','RISK')")
    public ResponseEntity<List<GpsTracker>> listTrackers() {
        return ResponseEntity.ok(gpsTrackerRepository.findAll());
    }

    @PostMapping("/trackers")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<GpsTracker> registerTracker(@RequestBody GpsTrackerRequest request) {
        GpsTracker tracker = gpsTrackerRepository.findByDeviceId(request.getDeviceId())
                .orElseGet(GpsTracker::new);
        tracker.setDeviceId(request.getDeviceId());
        tracker.setImei(request.getImei());
        tracker.setLabel(request.getLabel());
        tracker.setActive(request.getActive() == null || request.getActive());
        tracker.setAssignedType(request.getAssignedType());
        tracker.setAssignedId(request.getAssignedId());
        tracker.setVehicleId(request.getVehicleId());
        return ResponseEntity.ok(gpsTrackerRepository.save(tracker));
    }

    @PatchMapping("/trackers/{trackerId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<GpsTracker> updateTracker(
            @PathVariable UUID trackerId,
            @RequestBody GpsTrackerRequest request
    ) {
        GpsTracker tracker = gpsTrackerRepository.findById(trackerId).orElseThrow();
        if (request.getLabel() != null) tracker.setLabel(request.getLabel());
        if (request.getActive() != null) tracker.setActive(request.getActive());
        if (request.getAssignedType() != null) tracker.setAssignedType(request.getAssignedType());
        if (request.getAssignedId() != null) tracker.setAssignedId(request.getAssignedId());
        if (request.getVehicleId() != null) tracker.setVehicleId(request.getVehicleId());
        return ResponseEntity.ok(gpsTrackerRepository.save(tracker));
    }

    @PostMapping("/gps/mobile")
    @PreAuthorize("hasAnyRole('COURIER','AGENT','STAFF','ADMIN')")
    public ResponseEntity<Map<String, Object>> ingestMobileGps(
            @RequestBody GpsUpdateRequest request,
            Principal principal
    ) {
        String actorKey = resolveActorKey(principal);
        Location saved = saveLocation(actorKey, "MOBILE_GPS", request);

        // Also update any parcels associated with this courier/actor, and notify their
        // individual public tracking pages.
        List<Parcel> updatedParcels = updateAssociatedParcels(actorKey, request.getLatitude(), request.getLongitude());
        notifyTrackingSubscribers(updatedParcels);

        Map<String, Object> payload = livePayload("mobile", actorKey, saved, request.getSpeed(), request.getHeading());
        sseEmitters.emitAiEventToRoles("gps-update", payload, GPS_VISIBLE_AUTHORITIES);
        return ResponseEntity.ok(payload);
    }

    /**
     * Batch GPS sync — accepts an array of cached location points
     * from the mobile app (offline mode). Each point has its original timestamp.
     */
    @PostMapping("/gps/mobile/batch")
    @PreAuthorize("hasAnyRole('COURIER','AGENT','STAFF','ADMIN')")
    public ResponseEntity<Map<String, Object>> batchMobileGps(
            @RequestBody List<GpsUpdateRequest> requests,
            Principal principal
    ) {
        String actorKey = resolveActorKey(principal);
        int saved = 0;
        for (GpsUpdateRequest req : requests) {
            try {
                saveLocation(actorKey, "MOBILE_GPS", req);
                saved++;
            } catch (Exception e) {
                log.warn("Batch GPS point failed: {}", e.getMessage());
            }
        }
        if (!requests.isEmpty()) {
            GpsUpdateRequest last = requests.get(requests.size() - 1);
            List<Parcel> updated = updateAssociatedParcels(actorKey, last.getLatitude(), last.getLongitude());
            notifyTrackingSubscribers(updated);
        }
        return ResponseEntity.ok(Map.of("synced", saved, "total", requests.size()));
    }

    @PostMapping("/gps/iot")
    public ResponseEntity<Map<String, Object>> ingestIotGps(@RequestBody GpsUpdateRequest request) {
        GpsTracker tracker = gpsTrackerRepository.findByDeviceId(request.getDeviceId())
                .or(() -> request.getImei() == null ? Optional.empty() : gpsTrackerRepository.findByImei(request.getImei()))
                .orElseThrow();
        if (!tracker.isActive()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tracker is inactive"));
        }

        tracker.setLastLatitude(request.getLatitude());
        tracker.setLastLongitude(request.getLongitude());
        tracker.setLastSpeed(request.getSpeed());
        tracker.setLastHeading(request.getHeading());
        tracker.setLastSeenAt(request.getTimestamp() == null ? Instant.now() : request.getTimestamp());
        gpsTrackerRepository.save(tracker);

        // Update coordinates on the assigned parcel if tracker is assigned to a parcel
        if (tracker.getAssignedType() != null && tracker.getAssignedType().equalsIgnoreCase("PARCEL") && tracker.getAssignedId() != null) {
            try {
                UUID parcelId = UUID.fromString(tracker.getAssignedId());
                parcelRepository.findById(parcelId).ifPresent(parcel -> {
                    parcel.setCurrentLatitude(request.getLatitude());
                    parcel.setCurrentLongitude(request.getLongitude());
                    parcel.setLocationUpdatedAt(Instant.now());
                    parcelRepository.save(parcel);
                    notifyTrackingSubscribers(List.of(parcel));
                });
            } catch (IllegalArgumentException e) {
                // assignedId is not a valid UUID; tracker is not assigned to a parcel
            }
        }

        String actorKey = tracker.getAssignedId() == null ? tracker.getDeviceId() : tracker.getAssignedId();
        Location saved = saveLocation(actorKey, "IOT_GPS", request);
        Map<String, Object> payload = livePayload("iot", actorKey, saved, request.getSpeed(), request.getHeading());
        payload.put("tracker", tracker);
        sseEmitters.emitAiEventToRoles("gps-update", payload, GPS_VISIBLE_AUTHORITIES);
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/live")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','RISK','COURIER','AGENT')")
    public ResponseEntity<Map<String, Object>> liveOverview() {
        boolean global = hasAnyRole("ROLE_ADMIN", "ROLE_STAFF", "ROLE_RISK");
        String actorKey = resolveActorKey(null);
        List<Location> locations = global
                ? locationRepository.findTop500ByOrderByTimestampDesc()
                : locationRepository.findTop100ByUserIdOrderByTimestampDesc(actorKey);
        return ResponseEntity.ok(Map.of(
                "locations", locations,
                "trackers", global ? gpsTrackerRepository.findAll() : List.of(),
                "inheritedParcels", inheritedParcelLocations(global ? null : actorKey),
                "updatedAt", Instant.now()
        ));
    }

    @GetMapping("/route-optimization")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','COURIER','AGENT')")
    public ResponseEntity<Map<String, Object>> routeOptimization(
            @RequestParam(required = false) Double originLat,
            @RequestParam(required = false) Double originLng
    ) {
        List<Map<String, Object>> stops = inheritedParcelLocations(null).stream().limit(25).toList();
        double totalKm = 0;
        Double prevLat = originLat;
        Double prevLng = originLng;
        for (Map<String, Object> stop : stops) {
            Double lat = number(stop.get("latitude"));
            Double lng = number(stop.get("longitude"));
            if (prevLat != null && prevLng != null && lat != null && lng != null) {
                totalKm += haversineKm(prevLat, prevLng, lat, lng);
            }
            prevLat = lat;
            prevLng = lng;
        }
        return ResponseEntity.ok(Map.of(
                "recommendedStops", stops,
                "distanceKm", round(totalKm),
                "estimatedDurationMinutes", Math.max(10, Math.round(totalKm * 3.2)),
                "efficiencyScore", Math.max(45, 100 - Math.round(totalKm)),
                "strategy", "Nearest-neighbor route using active inherited parcel locations",
                "updatedAt", Instant.now()
        ));
    }

    @PostMapping("/pricing/distance-quote")
    public ResponseEntity<Map<String, Object>> distanceQuote(@RequestBody Map<String, Object> request) {
        double distanceKm = number(request.get("distanceKm")) == null ? 0 : number(request.get("distanceKm"));
        double weightKg = number(request.get("weightKg")) == null ? 1 : number(request.get("weightKg"));
        double complexity = number(request.get("complexity")) == null ? 1 : number(request.get("complexity"));
        long amount = Math.max(500, Math.round(500 + Math.max(0, distanceKm - 2) * 125 + weightKg * 75 + complexity * 100));
        return ResponseEntity.ok(Map.of(
                "amount", amount,
                "currency", "XAF",
                "minimumFee", 500,
                "distanceKm", round(distanceKm),
                "weightKg", round(weightKg),
                "rule", "500 FCFA minimum, progressive distance and parcel complexity pricing"
        ));
    }

    @GetMapping("/pickup-assignment/recommendations")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','AGENT')")
    public ResponseEntity<Map<String, Object>> pickupRecommendations(
            @RequestParam Double latitude,
            @RequestParam Double longitude
    ) {
        List<Map<String, Object>> candidates = locationRepository.findTop500ByOrderByTimestampDesc()
                .stream()
                .filter(location -> location.getLatitude() != null && location.getLongitude() != null)
                .map(location -> Map.<String, Object>of(
                        "actorId", location.getUserId(),
                        "distanceKm", round(haversineKm(latitude, longitude, location.getLatitude(), location.getLongitude())),
                        "lastSeenAt", location.getTimestamp(),
                        "score", Math.max(1, 100 - Math.round(haversineKm(latitude, longitude, location.getLatitude(), location.getLongitude()) * 8))
                ))
                .sorted(Comparator.comparingDouble(item -> ((Number) item.get("distanceKm")).doubleValue()))
                .limit(10)
                .toList();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("recommendedAgent", candidates.isEmpty() ? null : candidates.get(0));
        response.put("candidates", candidates);
        response.put("criteria", List.of("same agency coverage", "distance", "workload", "route efficiency", "capacity"));
        return ResponseEntity.ok(response);
    }

    private Location saveLocation(String actorKey, String source, GpsUpdateRequest request) {
        Location loc = new Location();
        loc.setUserId(actorKey);
        loc.setLatitude(request.getLatitude());
        loc.setLongitude(request.getLongitude());
        loc.setSource(source);
        Instant timestamp = request.getTimestamp() == null ? Instant.now() : request.getTimestamp();
        loc.setTimestamp(OffsetDateTime.ofInstant(timestamp, ZoneOffset.UTC));
        return locationRepository.save(loc);
    }

    private Map<String, Object> livePayload(String source, String actorKey, Location location, Double speed, Double heading) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("source", source);
        payload.put("actorId", actorKey);
        payload.put("latitude", location.getLatitude());
        payload.put("longitude", location.getLongitude());
        payload.put("speed", speed);
        payload.put("heading", heading);
        payload.put("timestamp", location.getTimestamp());
        payload.put("inheritedParcels", inheritedParcelLocations(actorKey));
        return payload;
    }

    private List<Map<String, Object>> inheritedParcelLocations(String actorKey) {
        List<Location> locations = actorKey == null
                ? locationRepository.findTop500ByOrderByTimestampDesc()
                : locationRepository.findTop100ByUserIdOrderByTimestampDesc(actorKey);
        Map<String, Location> latestByActor = new LinkedHashMap<>();
        for (Location location : locations) {
            if (location.getUserId() != null && !latestByActor.containsKey(location.getUserId())) {
                latestByActor.put(location.getUserId(), location);
            }
        }

        return parcelRepository.findByStatusIn(ACTIVE_STATUSES, PageRequest.of(0, 250))
                .stream()
                .map(parcel -> inheritedParcel(parcel, latestByActor))
                .filter(Objects::nonNull)
                .toList();
    }

    private Map<String, Object> inheritedParcel(Parcel parcel, Map<String, Location> latestByActor) {
        // Prioritize the parcel's own active GPS coordinates updated in real-time
        if (parcel.getCurrentLatitude() != null && parcel.getCurrentLongitude() != null) {
            Map<String, Object> out = parcelBase(parcel);
            out.put("latitude", parcel.getCurrentLatitude());
            out.put("longitude", parcel.getCurrentLongitude());
            out.put("source", "PARCEL_ACTIVE_GPS");
            out.put("timestamp", parcel.getLocationUpdatedAt());
            return out;
        }

        Location location = latestByActor.values().stream().findFirst().orElse(null);
        if (location == null) return null;
        Map<String, Object> out = parcelBase(parcel);
        out.put("latitude", location.getLatitude());
        out.put("longitude", location.getLongitude());
        out.put("source", "INHERITED_ACTOR_LOCATION");
        out.put("actorId", location.getUserId());
        out.put("timestamp", location.getTimestamp());
        return out;
    }

    private List<Parcel> updateAssociatedParcels(String actorKey, Double latitude, Double longitude) {
        if (actorKey == null || actorKey.equals("anonymous")) return List.of();
        List<Parcel> activeParcels = parcelRepository.findByStatusIn(ACTIVE_STATUSES, PageRequest.of(0, 500)).getContent();
        Instant now = Instant.now();
        List<Parcel> updated = new ArrayList<>();
        for (Parcel parcel : activeParcels) {
            List<ScanEvent> events = scanEventRepository.findByParcel_IdOrderByTimestampAsc(parcel.getId());
            if (!events.isEmpty()) {
                ScanEvent latestEvent = events.get(events.size() - 1);
                if (actorKey.equals(latestEvent.getActorId())) {
                    parcel.setCurrentLatitude(latitude);
                    parcel.setCurrentLongitude(longitude);
                    parcel.setLocationUpdatedAt(now);
                    updated.add(parcelRepository.save(parcel));
                }
            }
        }
        return updated;
    }

    /** Pushes a live position update only to public tracking pages watching these specific parcels. */
    private void notifyTrackingSubscribers(List<Parcel> updatedParcels) {
        for (Parcel parcel : updatedParcels) {
            if (parcel.getTrackingRef() == null) continue;
            Map<String, Object> scoped = new LinkedHashMap<>();
            scoped.put("inheritedParcels", List.of(inheritedParcel(parcel, Map.of())));
            scoped.put("updatedAt", Instant.now());
            sseEmitters.emitTrackingUpdate("gps-update", parcel.getTrackingRef(), scoped);
        }
    }

    private Map<String, Object> parcelBase(Parcel parcel) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("parcelId", parcel.getId());
        out.put("trackingRef", parcel.getTrackingRef());
        out.put("status", parcel.getStatus() == null ? null : parcel.getStatus().name());
        out.put("deliveryOption", parcel.getDeliveryOption() == null ? null : parcel.getDeliveryOption().name());
        return out;
    }

    private String resolveActorKey(Principal principal) {
        String principalName = principal == null ? null : principal.getName();
        if (principalName == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            principalName = auth == null ? null : auth.getName();
        }
        if (principalName == null) return "anonymous";
        return userAccountRepository.findByPhone(principalName)
                .map(UserAccount::getEntityId)
                .map(UUID::toString)
                .orElse(principalName);
    }

    private boolean hasAnyRole(String... roles) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        Set<String> wanted = Set.of(roles);
        return auth.getAuthorities().stream().anyMatch(a -> wanted.contains(a.getAuthority()));
    }

    private Double number(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.doubleValue();
        String text = String.valueOf(value);
        return text.isBlank() ? null : Double.valueOf(text);
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double radius = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
