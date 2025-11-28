package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.*;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.ScanEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
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

        UserAccount currentUser = getCurrentUser();

        // seuls AGENT / STAFF / ADMIN peuvent scanner
        if (currentUser.getRole() == UserRole.CLIENT || currentUser.getRole() == UserRole.COURIER) {
            throw new AuthException(
                    ErrorCode.BUSINESS_ERROR,
                    "Not allowed to record scan events"
            );
        }

        Parcel parcel = parcelRepository.findById(request.getParcelId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        Agency agency = null;
        if (request.getAgencyId() != null) {
            agency = agencyRepository.findById(request.getAgencyId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Agency not found",
                            ErrorCode.AGENCY_NOT_FOUND
                    ));
        }

        Agent agent = null;
        if (request.getAgentId() != null) {
            agent = agentRepository.findById(request.getAgentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Agent not found",
                            ErrorCode.AGENT_NOT_FOUND
                    ));
        } else if (currentUser.getRole() == UserRole.AGENT) {
            // si pas d’agentId dans le body mais user courant est un AGENT
            agent = agentRepository.findById(currentUser.getEntityId())
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

        scanEventRepository.save(event);

        // mettre à jour le statut du colis selon l’event
        ParcelStatus newStatus = applyParcelStatusFromEvent(parcel, type);
        if (newStatus != null) {
            parcel.setStatus(newStatus);
            parcelRepository.save(parcel);

            // 🔔 si le colis vient d’être livré, notifier le client
            if (newStatus == ParcelStatus.DELIVERED) {
                notificationService.notifyParcelDelivered(parcel);
            }
        }

        return toResponse(event);
    }

    // ================== HISTORY (US39) ==================
    @Override
    public List<ScanEventResponse> getHistoryForParcel(UUID parcelId) {

        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        // contrôle d’accès lecture :
        UserAccount user = getCurrentUser();
        if (user.getRole() == UserRole.CLIENT
                && !parcel.getClient().getId().equals(user.getEntityId())) {
            throw new AuthException(
                    ErrorCode.BUSINESS_ERROR,
                    "You cannot access this parcel’s tracking"
            );
        }

        List<ScanEvent> events = scanEventRepository
                .findByParcel_IdOrderByTimestampAsc(parcelId);

        return events.stream()
                .map(this::toResponse)
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

        String subject = auth.getName(); // sub = UUID ou phone

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
