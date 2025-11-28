package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.pickup.*;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.model.enums.PickupRequestState;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PickupRequestRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.PickupRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PickupRequestServiceImpl implements PickupRequestService {

    private final PickupRequestRepository pickupRequestRepository;
    private final ParcelRepository parcelRepository;
    private final CourierRepository courierRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService; // 🔔

    // ================== CREATE (US25) ==================
    @Override
    public PickupResponse createPickupRequest(CreatePickupRequest request) {

        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Current user is not a client");
        }

        // Récupérer le Parcel
        Parcel parcel = parcelRepository.findById(request.getParcelId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        // Vérifier que ce colis appartient bien au client connecté
        if (!parcel.getClient().getId().equals(user.getEntityId())) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "You do not own this parcel");
        }

        // Unicité : un pickup par parcel
        if (pickupRequestRepository.existsByParcel_Id(parcel.getId())) {
            throw new ConflictException(
                    "Pickup request already exists for this parcel",
                    ErrorCode.PICKUP_ALREADY_EXISTS
            );
        }

        PickupRequest pickup = PickupRequest.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .courier(null)
                .requestedDate(request.getRequestedDate())
                .timeWindow(request.getTimeWindow())
                .state(PickupRequestState.REQUESTED)
                .comment(request.getComment())
                .build();

        pickupRequestRepository.save(pickup);

        // 🔔 Notification automatique : pickup demandé
        notificationService.notifyPickupRequested(pickup);

        return toResponse(pickup);
    }

    // ================== GET BY ID ==================
    @Override
    public PickupResponse getPickupById(UUID pickupId) {
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pickup not found",
                        ErrorCode.PICKUP_NOT_FOUND
                ));

        enforceAccess(pickup);

        return toResponse(pickup);
    }

    // ================== GET BY PARCEL ==================
    @Override
    public PickupResponse getPickupByParcelId(UUID parcelId) {
        PickupRequest pickup = pickupRequestRepository.findByParcel_Id(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pickup not found for parcel",
                        ErrorCode.PICKUP_NOT_FOUND
                ));

        enforceAccess(pickup);

        return toResponse(pickup);
    }

    // ================== LIST MY PICKUPS (CLIENT) ==================
    @Override
    public Page<PickupResponse> listMyPickups(int page, int size) {
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Current user is not a client");
        }

        return pickupRequestRepository
                .findByParcel_Client_Id(user.getEntityId(), PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== LIST COURIER PICKUPS ==================
    @Override
    public Page<PickupResponse> listCourierPickups(int page, int size) {
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.COURIER) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Current user is not a courier");
        }

        return pickupRequestRepository
                .findByCourier_Id(user.getEntityId(), PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== LIST ALL PICKUPS (ADMIN/STAFF/AGENT) ==================
    @Override
    public Page<PickupResponse> listAllPickups(int page, int size) {
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to list all pickups");
        }

        return pickupRequestRepository
                .findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== ASSIGN COURIER (US26) ==================
    @Override
    public PickupResponse assignCourier(UUID pickupId, AssignPickupCourierRequest request) {

        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.STAFF && user.getRole() != UserRole.AGENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to assign couriers");
        }

        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pickup not found",
                        ErrorCode.PICKUP_NOT_FOUND
                ));

        Courier courier = courierRepository.findById(request.getCourierId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Courier not found",
                        ErrorCode.COURIER_NOT_FOUND
                ));

        // Ici tu pourras plus tard ajouter des règles de planning

        pickup.setCourier(courier);
        if (pickup.getState() == PickupRequestState.REQUESTED) {
            pickup.setState(PickupRequestState.ASSIGNED);
        }

        pickupRequestRepository.save(pickup);

        return toResponse(pickup);
    }

    // ================== UPDATE STATE (US27) ==================
    @Override
    public PickupResponse updatePickupState(UUID pickupId, UpdatePickupStateRequest request) {

        UserAccount user = getCurrentUserAccount();

        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pickup not found",
                        ErrorCode.PICKUP_NOT_FOUND
                ));

        if (user.getRole() == UserRole.COURIER) {
            if (pickup.getCourier() == null ||
                    !pickup.getCourier().getId().equals(user.getEntityId())) {
                throw new AuthException(ErrorCode.BUSINESS_ERROR, "This pickup is not assigned to you");
            }
        } else if (user.getRole() == UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Client cannot update pickup state");
        }

        PickupRequestState current = pickup.getState();
        PickupRequestState next = request.getState();

        validateStateTransition(current, next);

        pickup.setState(next);
        pickupRequestRepository.save(pickup);

        // 🔔 si le pickup est COMPLETED -> notifier le client
        if (next == PickupRequestState.COMPLETED) {
            notificationService.notifyPickupCompleted(pickup);
        }

        return toResponse(pickup);
    }

    // ================== STATE RULES ==================
    private void validateStateTransition(PickupRequestState current, PickupRequestState next) {
        if (current == next) return;

        if (current == PickupRequestState.COMPLETED || current == PickupRequestState.CANCELLED) {
            throw new AuthException(
                    ErrorCode.PICKUP_INVALID_STATE,
                    "Cannot change state from a final state: " + current
            );
        }

        if (next == PickupRequestState.CANCELLED) {
            return;
        }

        if (current == PickupRequestState.REQUESTED && next == PickupRequestState.ASSIGNED) {
            return;
        }
        if (current == PickupRequestState.ASSIGNED && next == PickupRequestState.COMPLETED) {
            return;
        }

        throw new AuthException(
                ErrorCode.PICKUP_INVALID_STATE,
                "Invalid pickup state transition: " + current + " -> " + next
        );
    }

    // ================== ACCESS CONTROL (lecture) ==================
    private void enforceAccess(PickupRequest pickup) {
        UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT) {
            if (!pickup.getParcel().getClient().getId().equals(user.getEntityId())) {
                throw new AuthException(ErrorCode.BUSINESS_ERROR, "You cannot access this pickup");
            }
        } else if (user.getRole() == UserRole.COURIER) {
            if (pickup.getCourier() == null ||
                    !pickup.getCourier().getId().equals(user.getEntityId())) {
                throw new AuthException(ErrorCode.BUSINESS_ERROR, "You cannot access this pickup");
            }
        }
        // STAFF / AGENT : OK
    }

    // ================== CURRENT USER ==================
    private UserAccount getCurrentUserAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Unauthenticated");
        }

        String subject = auth.getName(); // sub: UUID ou phone

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
    private PickupResponse toResponse(PickupRequest pickup) {

        Parcel parcel = pickup.getParcel();
        Client client = parcel.getClient();
        Courier courier = pickup.getCourier();

        return PickupResponse.builder()
                .id(pickup.getId())
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .clientId(client.getId())
                .clientName(client.getFullName())
                .courierId(courier != null ? courier.getId() : null)
                .courierName(courier != null ? courier.getFullName() : null)
                .requestedDate(pickup.getRequestedDate())
                .timeWindow(pickup.getTimeWindow())
                .state(pickup.getState())
                .comment(pickup.getComment())
                .createdAt(pickup.getCreatedAt())
                .build();
    }
}
