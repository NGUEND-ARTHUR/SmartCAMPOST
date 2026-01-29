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
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.ScanEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScanEventServiceImpl implements ScanEventService {

    private final ScanEventRepository scanEventRepository;
    private final ParcelRepository parcelRepository;
    private final AgencyRepository agencyRepository;
    private final AgentRepository agentRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService; // 🔔

    // ================== RECORD SCAN EVENT (US38 + US40) ==================
    @Override
    public ScanEventResponse recordScanEvent(ScanEventCreateRequest request) {

        Objects.requireNonNull(request, "request is required");
        Objects.requireNonNull(request.getParcelId(), "parcelId is required");
        Objects.requireNonNull(request.getEventType(), "eventType is required");

        UserAccount currentUser = getCurrentUser();

        // seuls AGENT / STAFF / ADMIN peuvent scanner
        if (currentUser.getRole() == UserRole.CLIENT || currentUser.getRole() == UserRole.COURIER) {
            throw new AuthException(
                    ErrorCode.BUSINESS_ERROR,
                    "Not allowed to record scan events"
            );
        }

        UUID reqParcelId = Objects.requireNonNull(request.getParcelId(), "parcelId is required");
        Parcel parcel = parcelRepository.findById(reqParcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

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

        // créer l’event
        ScanEvent event = ScanEvent.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .agency(agency)
                .agent(agent)
                .eventType(type)
                .timestamp(Instant.now())
                .locationNote(request.getLocationNote())
                .build();
        ScanEvent toSave = java.util.Objects.requireNonNull(event, "event is required");
        ScanEvent savedEvent = scanEventRepository.save(toSave);
        if (savedEvent == null) throw new IllegalStateException("failed to save scan event");
        event = savedEvent;

        // mettre à jour le statut du colis selon l’event
        ParcelStatus newStatus = applyParcelStatusFromEvent(parcel, type);
        if (newStatus != null) {
            ParcelStatus oldStatus = parcel.getStatus();
            parcel.setStatus(newStatus);
            Parcel savedParcel = parcelRepository.save(parcel);
            if (savedParcel == null) throw new IllegalStateException("failed to save parcel");

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

            // 🔔 si le colis arrive à l'agence de destination
            if (eventName.equals("ARRIVED_DESTINATION") || eventName.equals("ARRIVED_HUB")) {
                if (newStatus == ParcelStatus.ARRIVED_HUB || oldStatus != ParcelStatus.ARRIVED_HUB) {
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

    // ================== STATUS AUTO-UPDATE ==================
    private ParcelStatus applyParcelStatusFromEvent(Parcel parcel, ScanEventType type) {
        String name = type.name(); // ex: "ARRIVAL", "DEPARTURE", "DELIVERED_AT_DESTINATION"

        // DELIVERED → colis livré
        if (name.startsWith("DELIVERED") || name.equals("DELIVERED")) {
            return ParcelStatus.DELIVERED;
        }

        // tout ce qui ressemble à ARRIVAL / DEPARTURE / OUT_FOR_DELIVERY => IN_TRANSIT
        if (name.contains("ARRIVAL")
                || name.contains("DEPARTURE")
                || name.contains("TRANSIT")
                || name.contains("OUT_FOR_DELIVERY")) {
            if (parcel.getStatus().ordinal() < ParcelStatus.IN_TRANSIT.ordinal()) {
                return ParcelStatus.IN_TRANSIT;
            }
            return parcel.getStatus();
        }

        if (name.contains("RETURN")) {
            return ParcelStatus.RETURNED;
        }

        return null;
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
            return userAccountRepository.findById(userId)
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
                .build();
    }
}
