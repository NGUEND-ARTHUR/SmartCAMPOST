package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.Agent;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.LocationSource;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.sse.SseEmitters;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.ScanEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ScanEventServiceImpl implements ScanEventService {

    private final ScanEventRepository scanEventRepository;
    private final ParcelRepository parcelRepository;
    private final AgencyRepository agencyRepository;
    private final AgentRepository agentRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService; // 🔔
    private final SseEmitters sseEmitters; // 📡
    private final ApplicationEventPublisher eventPublisher;

    // ================== RECORD SCAN EVENT (US38 + US40) ==================
    @Override
    public ScanEventResponse recordScanEvent(ScanEventCreateRequest request) {

        Objects.requireNonNull(request, "request is required");
        Objects.requireNonNull(request.getParcelId(), "parcelId is required");
        Objects.requireNonNull(request.getEventType(), "eventType is required");

        UserAccount currentUser = getCurrentUser();

        // Actor must be authoritative from authenticated context
        final String actorId = currentUser.getEntityId() != null ? currentUser.getEntityId().toString() : null;
        final String actorRole = currentUser.getRole() != null ? currentUser.getRole().name() : null;

        // String -> Enum (ScanEventType)
        ScanEventType type;
        try {
            type = ScanEventType.valueOf(request.getEventType().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AuthException(
                    ErrorCode.BUSINESS_ERROR,
                    "Unknown scan event type: " + request.getEventType()
            );
        }

        // Client scan events are only allowed for CANCELLED (own parcel)
        if (currentUser.getRole() == UserRole.CLIENT && type != ScanEventType.CANCELLED) {
            throw new AuthException(
                    ErrorCode.BUSINESS_ERROR,
                    "Clients are only allowed to record CANCELLED scan events"
            );
        }

        UUID reqParcelId = Objects.requireNonNull(request.getParcelId(), "parcelId is required");
        Parcel parcel = parcelRepository.findById(reqParcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        if (currentUser.getRole() == UserRole.CLIENT) {
            if (!Objects.equals(parcel.getClient().getId(), currentUser.getEntityId())) {
            throw new AuthException(
                ErrorCode.BUSINESS_ERROR,
                "You cannot cancel a parcel you do not own"
            );
            }
        }

        Agency agency = null;
        if (request.getAgencyId() != null) {
            UUID agencyId = Objects.requireNonNull(request.getAgencyId(), "agencyId is required");
            agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Agency not found",
                    ErrorCode.AGENCY_NOT_FOUND
                ));
        }

        Agent agent = null;
        if (request.getAgentId() != null) {
            UUID agentId = Objects.requireNonNull(request.getAgentId(), "agentId is required");
            agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Agent not found",
                    ErrorCode.AGENT_NOT_FOUND
                ));
        } else if (currentUser.getRole() == UserRole.AGENT) {
            // si pas d’agentId dans le body mais user courant est un AGENT
            UUID currentEntityId = Objects.requireNonNull(currentUser.getEntityId(), "current user entityId is required");
            agent = agentRepository.findById(currentEntityId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Agent not found for current user",
                    ErrorCode.AGENT_NOT_FOUND
                ));
        }

        Objects.requireNonNull(request.getLatitude(), "latitude is required");
        Objects.requireNonNull(request.getLongitude(), "longitude is required");

        // créer l’event
        ScanEvent event = ScanEvent.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .agency(agency)
                .agent(agent)
                .eventType(type)
                .timestamp(Instant.now())
                .locationNote(request.getLocationNote())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .locationSource(resolveLocationSource(request.getLocationSource()))
            .deviceTimestamp(request.getDeviceTimestamp())
            .actorId(actorId)
            .actorRole(actorRole)
            .proofUrl(request.getProofUrl())
            .comment(request.getComment())
                .build();
        ScanEvent toSave = java.util.Objects.requireNonNull(event, "event is required");
        ScanEvent savedEvent = Objects.requireNonNull(scanEventRepository.save(toSave), "failed to save scan event");
        event = savedEvent;

        // 🔁 Domain event for AI agents / downstream processors
        try {
            eventPublisher.publishEvent(new com.smartcampost.backend.ai.events.ScanEventRecordedEvent(
                    event.getId(),
                    parcel.getId(),
                    type,
                    event.getTimestamp(),
                    agency != null ? agency.getId() : null,
                    agent != null ? agent.getId() : null,
                    actorId,
                    actorRole
            ));
        } catch (Exception ex) {
            log.warn("Failed to publish ScanEventRecordedEvent", ex);
        }

        // 📡 Emit SSE for live dashboards (de-duplicated inside SseEmitters)
        try {
            sseEmitters.emitScan(event);
        } catch (Exception ex) {
            log.warn("Failed to emit SSE scan event", ex);
        }

        // mettre à jour le statut du colis selon l’event
        ParcelStatus newStatus = applyParcelStatusFromEvent(parcel, type);
        // 📍 Update parcel's current location from scan event GPS
        // Every scan event carries the GPS of the scanning device — this becomes
        // the parcel's last known location for map tracking
        updateParcelLocation(parcel, event);
        if (newStatus != null) {
            ParcelStatus oldStatus = parcel.getStatus();
            validateStatusTransition(oldStatus, newStatus);
            parcel.setStatus(newStatus);
            Parcel savedParcel = parcelRepository.save(parcel);
            Objects.requireNonNull(savedParcel, "failed to save parcel");

            try {
                eventPublisher.publishEvent(new com.smartcampost.backend.ai.events.ParcelStatusChangedEvent(
                        parcel.getId(),
                        oldStatus,
                        newStatus,
                        Instant.now()
                ));
            } catch (Exception ex) {
                log.warn("Failed to publish ParcelStatusChangedEvent", ex);
            }

            // 🔔 Notifications based on status changes
            String eventName = type.name();

            // 🔔 si le colis vient d'être livré, notifier le client
            if (newStatus == ParcelStatus.DELIVERED) {
                notificationService.notifyParcelDelivered(parcel);
            }

            // 🔔 si le colis passe en "OUT_FOR_DELIVERY" -> notification dédiée
            if (eventName.equals("OUT_FOR_DELIVERY") || 
                (newStatus == ParcelStatus.OUT_FOR_DELIVERY && oldStatus != ParcelStatus.OUT_FOR_DELIVERY)) {
                notificationService.notifyParcelOutForDelivery(parcel);
            }

            // 🔔 si le colis passe en transit
            if (newStatus == ParcelStatus.IN_TRANSIT && oldStatus != ParcelStatus.IN_TRANSIT) {
                notificationService.notifyParcelInTransit(parcel);
            }

            // 🔔 if the parcel arrives at destination agency/hub
            if (eventName.equals("ARRIVED_DESTINATION") || eventName.equals("ARRIVED_DEST_AGENCY") || eventName.equals("ARRIVED_HUB")) {
                if (newStatus == ParcelStatus.ARRIVED_DEST_AGENCY || newStatus == ParcelStatus.ARRIVED_HUB) {
                    notificationService.notifyParcelArrivedDestination(parcel);
                }
            }
        }

        return toResponse(event);
    }

    // ================== HISTORY (US39) ==================
    @Override
    public List<ScanEventResponse> getHistoryForParcel(UUID parcelId) {

        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Parcel not found",
                ErrorCode.PARCEL_NOT_FOUND
            ));

        // contrôle d’accès lecture :
        UserAccount user = getCurrentUser();
        if (user.getRole() == UserRole.CLIENT
            && !Objects.equals(parcel.getClient().getId(), user.getEntityId())) {
            throw new AuthException(
                    ErrorCode.BUSINESS_ERROR,
                    "You cannot access this parcel’s tracking"
            );
        }

        List<ScanEvent> events = scanEventRepository
            .findByParcel_IdOrderByTimestampAsc(id);

        return events.stream()
            .map(e -> toResponse(Objects.requireNonNull(e, "scan event is required")))
            .collect(Collectors.toList());
    }

    // ================== STATUS AUTO-UPDATE (CONTEXT-AWARE) ==================

    /**
     * Determines the new parcel status based on the scan event type AND the parcel's
     * delivery option (HOME vs AGENCY). This is the core business logic that drives
     * the parcel lifecycle.
     *
     * KEY RULES:
     * - HOME delivery: courier scans QR at client's home = TAKEN_IN_CHARGE (collection)
     * - AGENCY delivery: agent scans QR at agency = AT_ORIGIN_AGENCY → TAKEN_IN_CHARGE
     * - AT_ORIGIN_AGENCY always advances to TAKEN_IN_CHARGE (parcel is physically at agency)
     * - The rest of the transit chain is identical for both delivery options
     */
    private ParcelStatus applyParcelStatusFromEvent(Parcel parcel, ScanEventType type) {
        if (type == null) return null;

        return switch (type) {
            case CREATED -> ParcelStatus.CREATED;
            case ACCEPTED -> ParcelStatus.ACCEPTED;

            // Context-aware: AT_ORIGIN_AGENCY means client deposited at agency
            // → parcel is ready for transit → advance to TAKEN_IN_CHARGE
            case AT_ORIGIN_AGENCY -> ParcelStatus.TAKEN_IN_CHARGE;

            case TAKEN_IN_CHARGE -> ParcelStatus.TAKEN_IN_CHARGE;
            case IN_TRANSIT -> ParcelStatus.IN_TRANSIT;
            case ARRIVED_HUB -> ParcelStatus.ARRIVED_HUB;
            case DEPARTED_HUB -> ParcelStatus.IN_TRANSIT;
            case ARRIVED_DESTINATION, ARRIVED_DEST_AGENCY -> ParcelStatus.ARRIVED_DEST_AGENCY;

            // Context-aware last mile:
            // HOME delivery → OUT_FOR_DELIVERY makes sense (courier is en route)
            // AGENCY delivery → OUT_FOR_DELIVERY still valid (parcel moved to pickup counter)
            case OUT_FOR_DELIVERY -> ParcelStatus.OUT_FOR_DELIVERY;

            case DELIVERED -> ParcelStatus.DELIVERED;
            case PICKED_UP_AT_AGENCY -> ParcelStatus.PICKED_UP_AT_AGENCY;
            case RETURNED_TO_SENDER -> ParcelStatus.RETURNED_TO_SENDER;
            case RETURNED -> ParcelStatus.RETURNED;
            case CANCELLED -> ParcelStatus.CANCELLED;

            // Operational / audit events do not auto-change parcel status
            case DELIVERY_FAILED, RESCHEDULED, OTP_SENT, OTP_VERIFIED, PROOF_CAPTURED, PAYMENT_CONFIRMED -> null;
        };
    }

    // ================== ALLOWED TRANSITIONS MAP ==================

    /**
     * Explicit allowed transitions map — replaces ordinal-based comparison.
     * Each status maps to the set of statuses it can transition TO.
     * CANCELLED, RETURNED, and RETURNED_TO_SENDER are always allowed (handled separately).
     */
    private static final Map<ParcelStatus, Set<ParcelStatus>> ALLOWED_TRANSITIONS;
    static {
        ALLOWED_TRANSITIONS = new EnumMap<>(ParcelStatus.class);

        ALLOWED_TRANSITIONS.put(ParcelStatus.CREATED, EnumSet.of(
                ParcelStatus.ACCEPTED
        ));
        ALLOWED_TRANSITIONS.put(ParcelStatus.ACCEPTED, EnumSet.of(
                ParcelStatus.TAKEN_IN_CHARGE,
                ParcelStatus.IN_TRANSIT   // small parcels may skip TAKEN_IN_CHARGE
        ));
        ALLOWED_TRANSITIONS.put(ParcelStatus.TAKEN_IN_CHARGE, EnumSet.of(
                ParcelStatus.IN_TRANSIT,
                ParcelStatus.ARRIVED_HUB  // direct to hub if single-hop
        ));
        ALLOWED_TRANSITIONS.put(ParcelStatus.IN_TRANSIT, EnumSet.of(
                ParcelStatus.ARRIVED_HUB,
                ParcelStatus.ARRIVED_DEST_AGENCY,  // direct to destination if no intermediate hub
                ParcelStatus.OUT_FOR_DELIVERY       // direct delivery if same-city
        ));
        ALLOWED_TRANSITIONS.put(ParcelStatus.ARRIVED_HUB, EnumSet.of(
                ParcelStatus.IN_TRANSIT,            // DEPARTED_HUB → back to IN_TRANSIT
                ParcelStatus.ARRIVED_DEST_AGENCY,
                ParcelStatus.OUT_FOR_DELIVERY
        ));
        ALLOWED_TRANSITIONS.put(ParcelStatus.ARRIVED_DEST_AGENCY, EnumSet.of(
                ParcelStatus.OUT_FOR_DELIVERY,
                ParcelStatus.PICKED_UP_AT_AGENCY,
                ParcelStatus.DELIVERED              // agency hand-off counts as delivered
        ));
        ALLOWED_TRANSITIONS.put(ParcelStatus.OUT_FOR_DELIVERY, EnumSet.of(
                ParcelStatus.DELIVERED,
                ParcelStatus.ARRIVED_DEST_AGENCY   // returned to agency after failed delivery
        ));

        // Final states — no forward transitions (only CANCEL/RETURN handled separately)
        ALLOWED_TRANSITIONS.put(ParcelStatus.DELIVERED, EnumSet.noneOf(ParcelStatus.class));
        ALLOWED_TRANSITIONS.put(ParcelStatus.PICKED_UP_AT_AGENCY, EnumSet.noneOf(ParcelStatus.class));
        ALLOWED_TRANSITIONS.put(ParcelStatus.RETURNED_TO_SENDER, EnumSet.noneOf(ParcelStatus.class));
        ALLOWED_TRANSITIONS.put(ParcelStatus.RETURNED, EnumSet.noneOf(ParcelStatus.class));
        ALLOWED_TRANSITIONS.put(ParcelStatus.CANCELLED, EnumSet.noneOf(ParcelStatus.class));
    }

    private void validateStatusTransition(ParcelStatus current, ParcelStatus next) {
        if (current == next) return;

        // Final states: no transitions out
        if (current == ParcelStatus.DELIVERED
                || current == ParcelStatus.PICKED_UP_AT_AGENCY
                || current == ParcelStatus.RETURNED_TO_SENDER
                || current == ParcelStatus.RETURNED
                || current == ParcelStatus.CANCELLED) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Cannot change status from a final state: " + current
            );
        }

        // Cancel/Return always possible before final
        if (next == ParcelStatus.CANCELLED
                || next == ParcelStatus.RETURNED
                || next == ParcelStatus.RETURNED_TO_SENDER) {
            return;
        }

        // Check explicit allowed transitions
        Set<ParcelStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(current, EnumSet.noneOf(ParcelStatus.class));
        if (!allowed.contains(next)) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Invalid status transition: " + current + " -> " + next
            );
        }
    }

    // ================== PARCEL LOCATION UPDATE ==================

    /**
     * Updates the parcel's denormalized current location from the scan event GPS.
     * The parcel's location during transit = the GPS of the last scanning device.
     */
    private void updateParcelLocation(Parcel parcel, ScanEvent event) {
        if (event.getLatitude() != null && event.getLongitude() != null) {
            parcel.setCurrentLatitude(event.getLatitude());
            parcel.setCurrentLongitude(event.getLongitude());
            parcel.setLocationUpdatedAt(event.getTimestamp());
            parcelRepository.save(parcel);
        }
    }

    // ================== CURRENT USER ==================
    private UserAccount getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(
                    ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "Unauthenticated"
            );
        }

        String subject = Objects.requireNonNull(auth.getName(), "authentication name is required"); // sub = UUID ou phone

        try {
            UUID userId = UUID.fromString(subject);
            return userAccountRepository.findById(Objects.requireNonNull(userId, "userId is required"))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        } catch (IllegalArgumentException ex) {
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        }
    }

    // ================== MAPPER ==================
    private ScanEventResponse toResponse(ScanEvent event) {

        Parcel parcel = event.getParcel();
        Agency agency = event.getAgency();
        Agent agent = event.getAgent();

        return ScanEventResponse.builder()
                .id(event.getId())
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .agencyId(agency != null ? agency.getId() : null)
                .agencyName(agency != null ? agency.getAgencyName() : null)
                .agentId(agent != null ? agent.getId() : null)
                .agentName(agent != null ? agent.getFullName() : null)
                .eventType(event.getEventType().name())
                .timestamp(event.getTimestamp())
                .locationNote(event.getLocationNote())
                .parcelStatusAfter(parcel.getStatus())
                // GPS fields
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .locationSource(event.getLocationSource() != null ? event.getLocationSource().name() : null)
                // Actor info
                .actorId(event.getActorId())
                .actorRole(event.getActorRole())
                // Proof
                .proofUrl(event.getProofUrl())
                .comment(event.getComment())
                // Sync status
                .synced(event.isSynced())
                .build();
    }

    // ================== OFFLINE SYNC (SPEC SECTION 11) ==================

    /**
     * Sync offline events - processes events that were recorded offline
     * and syncs them to the server with proper ordering by deviceTimestamp.
     */
    @Override
    public com.smartcampost.backend.dto.scan.OfflineSyncResponse syncOfflineEvents(
            com.smartcampost.backend.dto.scan.OfflineSyncRequest request) {

        Objects.requireNonNull(request, "request is required");
        Objects.requireNonNull(request.getEvents(), "events list is required");

        UserAccount currentUser = getCurrentUser();
        
        // Clients are not allowed to sync operational scan events
        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new AuthException(
                    ErrorCode.BUSINESS_ERROR,
                    "Not allowed to sync scan events"
            );
        }

        final int totalEvents = request.getEvents().size();
        final String batchId = (request.getBatchId() != null && !request.getBatchId().isBlank())
                ? request.getBatchId()
                : java.util.UUID.randomUUID().toString();

        List<com.smartcampost.backend.dto.scan.OfflineSyncResponse.SyncedEvent> syncedEvents = 
            new java.util.ArrayList<>();
        List<com.smartcampost.backend.dto.scan.OfflineSyncResponse.FailedEvent> failedEvents = 
            new java.util.ArrayList<>();

        // Legacy failure format (kept for backward compatibility with existing frontend)
        List<com.smartcampost.backend.dto.scan.OfflineSyncResponse.SyncFailure> failures =
            new java.util.ArrayList<>();

        // Sort events by deviceTimestamp to maintain correct order
        List<ScanEventCreateRequest> sortedEvents = request.getEvents().stream()
                .sorted((a, b) -> {
                    Instant timeA = a.getDeviceTimestamp() != null ? a.getDeviceTimestamp() : Instant.now();
                    Instant timeB = b.getDeviceTimestamp() != null ? b.getDeviceTimestamp() : Instant.now();
                    return timeA.compareTo(timeB);
                })
                .collect(Collectors.toList());

        for (int idx = 0; idx < sortedEvents.size(); idx++) {
            ScanEventCreateRequest eventRequest = sortedEvents.get(idx);
            try {
                // Create the scan event with offline metadata
                ScanEventResponse response = recordOfflineScanEvent(eventRequest, request.getDeviceId());
                
                syncedEvents.add(com.smartcampost.backend.dto.scan.OfflineSyncResponse.SyncedEvent.builder()
                        .localId(eventRequest.getLocalId())
                        .serverId(response.getId())
                        .serverTimestamp(response.getTimestamp())
                        .build());
                        
            } catch (Exception e) {
                failedEvents.add(com.smartcampost.backend.dto.scan.OfflineSyncResponse.FailedEvent.builder()
                        .localId(eventRequest.getLocalId())
                        .error(e.getMessage())
                        .retryable(isRetryableError(e))
                        .build());

                failures.add(com.smartcampost.backend.dto.scan.OfflineSyncResponse.SyncFailure.builder()
                    .eventIndex(idx)
                    .parcelId(eventRequest.getParcelId() != null ? eventRequest.getParcelId().toString() : null)
                    .eventType(eventRequest.getEventType())
                    .errorMessage(e.getMessage())
                    .build());
            }
        }

        return com.smartcampost.backend.dto.scan.OfflineSyncResponse.builder()
                .batchId(batchId)
                .totalEvents(totalEvents)
                .successCount(syncedEvents.size())
                .failureCount(failedEvents.size())
                .failures(failures)
                .syncedAt(Instant.now())
                .syncedCount(syncedEvents.size())
                .failedCount(failedEvents.size())
                .syncedEvents(syncedEvents)
                .failedEvents(failedEvents)
                .serverTimestamp(Instant.now())
                .build();
    }

    /**
     * Record a scan event that was created offline.
     */
    private ScanEventResponse recordOfflineScanEvent(ScanEventCreateRequest request, String deviceId) {
            UserAccount currentUser = getCurrentUser();

            // Actor must be authoritative from authenticated context
            final String actorId = currentUser.getEntityId() != null ? currentUser.getEntityId().toString() : null;
            final String actorRole = currentUser.getRole() != null ? currentUser.getRole().name() : null;
        Objects.requireNonNull(request.getParcelId(), "parcelId is required");
        Objects.requireNonNull(request.getEventType(), "eventType is required");
        Objects.requireNonNull(request.getLatitude(), "GPS latitude is mandatory");
        Objects.requireNonNull(request.getLongitude(), "GPS longitude is mandatory");

        UUID reqParcelId = request.getParcelId();
        Parcel parcel = parcelRepository.findById(Objects.requireNonNull(reqParcelId, "parcelId is required"))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        Agency agency = null;
        if (request.getAgencyId() != null) {
            agency = agencyRepository.findById(Objects.requireNonNull(request.getAgencyId(), "agencyId is required"))
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Agency not found",
                    ErrorCode.AGENCY_NOT_FOUND
                ));
        }

        Agent agent = null;
        if (request.getAgentId() != null) {
            agent = agentRepository.findById(Objects.requireNonNull(request.getAgentId(), "agentId is required"))
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Agent not found",
                    ErrorCode.AGENT_NOT_FOUND
                ));
        } else if (currentUser.getRole() == UserRole.AGENT) {
            UUID currentEntityId = Objects.requireNonNull(currentUser.getEntityId(), "current user entityId is required");
            agent = agentRepository.findById(currentEntityId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Agent not found for current user",
                    ErrorCode.AGENT_NOT_FOUND
                ));
        }

        ScanEventType type;
        try {
            type = ScanEventType.valueOf(request.getEventType().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AuthException(
                    ErrorCode.BUSINESS_ERROR,
                    "Unknown scan event type: " + request.getEventType()
            );
        }

        // Create event with offline metadata
        ScanEvent event = ScanEvent.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .agency(agency)
                .agent(agent)
                .eventType(type)
                .timestamp(Instant.now())
                .locationNote(request.getLocationNote())
                // GPS data (mandatory)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationSource(resolveLocationSource(request.getLocationSource()))
                // Device timestamp for offline sync ordering
                .deviceTimestamp(request.getDeviceTimestamp())
                // Actor info
                .actorId(actorId)
                .actorRole(actorRole)
                // Proof
                .proofUrl(request.getProofUrl())
                .comment(request.getComment())
                // Offline sync metadata
                .synced(true)
                .offlineCreatedAt(request.getDeviceTimestamp())
                .syncedAt(Instant.now())
                .build();

        @SuppressWarnings("null")
        ScanEvent savedEvent = scanEventRepository.save(event);

        // Update parcel location from scan event GPS
        updateParcelLocation(parcel, savedEvent);

        // Update parcel status based on event
        ParcelStatus newStatus = applyParcelStatusFromEvent(parcel, type);
        if (newStatus != null) {
            ParcelStatus oldStatus = parcel.getStatus();
            validateStatusTransition(oldStatus, newStatus);
            parcel.setStatus(newStatus);
            parcelRepository.save(parcel);
        }

        return toResponse(savedEvent);
    }

    private LocationSource resolveLocationSource(String raw) {
        if (raw == null || raw.isBlank()) {
            return LocationSource.DEVICE_GPS;
        }

        String normalized = raw.trim().toUpperCase();
        if ("GPS".equals(normalized)) {
            normalized = "DEVICE_GPS";
        }

        try {
            return LocationSource.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            return LocationSource.CACHED;
        }
    }

    /**
     * Get the last scan event for a parcel.
     */
    @Override
    public ScanEventResponse getLastScanEvent(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        
        Parcel parcel = parcelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Parcel not found",
                ErrorCode.PARCEL_NOT_FOUND
            ));

        // Access control
        UserAccount user = getCurrentUser();
        if (user.getRole() == UserRole.CLIENT
            && !Objects.equals(parcel.getClient().getId(), user.getEntityId())) {
            throw new AuthException(
                    ErrorCode.BUSINESS_ERROR,
                    "You cannot access this parcel's tracking"
            );
        }

        return scanEventRepository.findTopByParcel_IdOrderByTimestampDesc(id)
                .map(this::toResponse)
                .orElse(null);
    }

    /**
     * Determine if an error is retryable for offline sync.
     */
    private boolean isRetryableError(Exception e) {
        // Network errors, timeouts are retryable
        // Validation errors, not found errors are not retryable
        if (e instanceof ResourceNotFoundException) {
            return false;
        }
        if (e instanceof AuthException) {
            return false;
        }
        // Database connectivity issues, etc. are retryable
        return true;
    }
}
