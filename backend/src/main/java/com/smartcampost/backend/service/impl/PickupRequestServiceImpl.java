package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.pickup.*;
import com.smartcampost.backend.dto.qr.QrCodeData;
import com.smartcampost.backend.dto.qr.QrLabelData;
import com.smartcampost.backend.dto.qr.TemporaryQrData;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.PickupRequestState;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PickupRequestRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.PickupRequestService;
import com.smartcampost.backend.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PickupRequestServiceImpl implements PickupRequestService {

    private final PickupRequestRepository pickupRequestRepository;
    private final ParcelRepository parcelRepository;
    private final CourierRepository courierRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService;
    private final QrCodeService qrCodeService;

    // ================== CREATE (US25) ==================
    @Override
    public PickupResponse createPickupRequest(CreatePickupRequest request) {
        Objects.requireNonNull(request, "request must not be null");

        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Current user is not a client");
        }

        // Récupérer le Parcel
        Objects.requireNonNull(request.getParcelId(), "parcelId is required");
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
        Objects.requireNonNull(pickupId, "pickupId is required");

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
        Objects.requireNonNull(parcelId, "parcelId is required");
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
        Objects.requireNonNull(user.getEntityId(), "current user's entityId is required");
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
        Objects.requireNonNull(user.getEntityId(), "current user's entityId is required");
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
        Objects.requireNonNull(pickupId, "pickupId is required");
        Objects.requireNonNull(request, "request must not be null");

        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.STAFF && user.getRole() != UserRole.AGENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to assign couriers");
        }

        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Pickup not found",
                ErrorCode.PICKUP_NOT_FOUND
            ));

        Objects.requireNonNull(request.getCourierId(), "courierId is required");
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
        Objects.requireNonNull(pickupId, "pickupId is required");
        Objects.requireNonNull(request, "request must not be null");

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

    // ==================== QR CODE WORKFLOW ====================

    @Override
    public TemporaryQrData generatePickupQrCode(UUID pickupId) {
        Objects.requireNonNull(pickupId, "pickupId is required");
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Pickup not found", ErrorCode.PICKUP_NOT_FOUND));

        // Verify access - only the owning client can get QR
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() == UserRole.CLIENT) {
            if (!pickup.getParcel().getClient().getId().equals(user.getEntityId())) {
                throw new AuthException(ErrorCode.BUSINESS_ERROR, "You cannot access this pickup");
            }
        }

        return qrCodeService.generateTemporaryQrForPickup(pickupId);
    }

    @Override
    public TemporaryQrData getPickupByTemporaryQr(String temporaryQrToken) {
        return qrCodeService.validateTemporaryQr(temporaryQrToken);
    }

    @Override
    @Transactional
    public ConfirmPickupResponse confirmPickupWithQrScan(ConfirmPickupRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        UserAccount user = getCurrentUserAccount();

        // Only agents, couriers, or staff can confirm pickups
        if (user.getRole() == UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Clients cannot confirm pickups");
        }

        // Get pickup - either by QR token or by ID
        PickupRequest pickup;
        TemporaryQrData tempQrData = null;

        if (request.getTemporaryQrToken() != null && !request.getTemporaryQrToken().isEmpty()) {
            // Validate temporary QR and get pickup
            tempQrData = qrCodeService.validateTemporaryQr(request.getTemporaryQrToken());
            Objects.requireNonNull(tempQrData.getPickupId(), "pickupId from tempQr must not be null");
            pickup = pickupRequestRepository.findById(tempQrData.getPickupId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Pickup not found", ErrorCode.PICKUP_NOT_FOUND));
        } else if (request.getPickupId() != null) {
            Objects.requireNonNull(request.getPickupId(), "pickupId is required");
            pickup = pickupRequestRepository.findById(request.getPickupId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Pickup not found", ErrorCode.PICKUP_NOT_FOUND));
        } else {
            throw new AuthException(ErrorCode.VALIDATION_ERROR,
                    "Either temporaryQrToken or pickupId must be provided");
        }

        // Verify pickup is in correct state
        if (pickup.getState() == PickupRequestState.COMPLETED) {
            throw new AuthException(ErrorCode.PICKUP_INVALID_STATE, "Pickup is already completed");
        }
        if (pickup.getState() == PickupRequestState.CANCELLED) {
            throw new AuthException(ErrorCode.PICKUP_INVALID_STATE, "Pickup is cancelled");
        }

        Parcel parcel = pickup.getParcel();
        Instant now = Instant.now();

        // Update parcel with validated information
        if (request.getActualWeight() != null) {
            parcel.setValidatedWeight(request.getActualWeight());
        }
        if (request.getActualDimensions() != null && !request.getActualDimensions().isEmpty()) {
            parcel.setValidatedDimensions(request.getActualDimensions());
        }
        if (request.getValidationComment() != null) {
            parcel.setValidationComment(request.getValidationComment());
        }
        if (request.getPhotoUrl() != null && !request.getPhotoUrl().isEmpty()) {
            parcel.setPhotoUrl(request.getPhotoUrl());
        }

        parcel.setDescriptionConfirmed(request.isDescriptionConfirmed());
        parcel.setValidatedAt(now);
        // Note: validatedBy should be Staff, but we only have UserAccount here
        // For now, we leave it null unless Staff can be retrieved

        // Transition parcel to ACCEPTED
        if (parcel.getStatus() == ParcelStatus.CREATED) {
            parcel.setStatus(ParcelStatus.ACCEPTED);
        }

        parcelRepository.save(parcel);

        // Update pickup state to COMPLETED
        pickup.setState(PickupRequestState.COMPLETED);
        pickupRequestRepository.save(pickup);

        // Convert temporary QR to permanent
        QrCodeData permanentQr = qrCodeService.convertTemporaryToPermanent(pickup.getId());

        // Generate label if requested
        QrLabelData labelData = null;
        if (request.isPrintLabel()) {
            labelData = qrCodeService.generatePrintableLabel(parcel.getId());
            if (request.getLabelCopies() > 0) {
                labelData.setCopiesCount(request.getLabelCopies());
            }
        }

        // Notify client
        notificationService.notifyPickupCompleted(pickup);
        notificationService.notifyParcelAccepted(parcel);

        // Build response
        return ConfirmPickupResponse.builder()
                .pickupId(pickup.getId())
                .pickupState(pickup.getState().name())
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .parcelStatus(parcel.getStatus().name())
                .agentId(user.getEntityId())
                .agentName(user.getPhone()) // Could get agent name if needed
                .validatedWeight(parcel.getValidatedWeight())
                .validatedDimensions(parcel.getValidatedDimensions())
                .validationComment(parcel.getValidationComment())
                .descriptionConfirmed(Boolean.TRUE.equals(parcel.getDescriptionConfirmed()))
                .validatedAt(parcel.getValidatedAt())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .qrCodeData(permanentQr)
                .labelData(labelData)
                .clientNotified(true)
                .notificationMessage("Votre colis " + parcel.getTrackingRef() + " a été pris en charge")
                .confirmedAt(now)
                .build();
    }
}
