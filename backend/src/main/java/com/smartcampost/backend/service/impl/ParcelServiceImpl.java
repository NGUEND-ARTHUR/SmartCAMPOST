package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.parcel.*;
import com.smartcampost.backend.dto.pricing.PricingDetailResponse;
import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.*;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.ParcelService;
import com.smartcampost.backend.service.PaymentService;
import com.smartcampost.backend.service.PricingService;
import com.smartcampost.backend.service.ScanEventService;
import com.smartcampost.backend.service.QrSecurityService;
import com.smartcampost.backend.dto.qr.SecureQrPayload;
import com.smartcampost.backend.model.QrVerificationToken;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.Objects;
import org.springframework.lang.Nullable;

@Service
@RequiredArgsConstructor
public class ParcelServiceImpl implements ParcelService {

    private final ParcelRepository parcelRepository;
    private final ClientRepository clientRepository;
    private final UserAccountRepository userAccountRepository;
    private final AddressRepository addressRepository;
    private final AgencyRepository agencyRepository;
    private final PricingDetailRepository pricingDetailRepository;
    private final StaffRepository staffRepository;

    // 🔥 SPRINT 14: services ajoutés
    private final NotificationService notificationService;
    private final PaymentService paymentService;

    // 🔥 SPRINT 15: pricing service for weight-based recalculation
    private final PricingService pricingService;

    private final ScanEventService scanEventService;

    private final QrSecurityService qrSecurityService;

    private final SecureRandom random = new SecureRandom();

    // ================== CREATE PARCEL (CLIENT) ==================
    @Override
    public ParcelResponse createParcel(CreateParcelRequest request) {

        Objects.requireNonNull(request, "request is required");
        Objects.requireNonNull(request.getSenderAddressId(), "senderAddressId is required");
        Objects.requireNonNull(request.getRecipientAddressId(), "recipientAddressId is required");
        // 1) récupérer user courant + client
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Current user is not a client");
        }

        UUID userEntityId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
        Client client = clientRepository.findById(userEntityId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Client not found",
                ErrorCode.AUTH_USER_NOT_FOUND
            ));

        // 2) addresses
        UUID senderId = Objects.requireNonNull(request.getSenderAddressId(), "senderAddressId is required");
        Address sender = addressRepository.findById(senderId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Sender address not found",
                ErrorCode.ADDRESS_NOT_FOUND
            ));

        UUID recipientId = Objects.requireNonNull(request.getRecipientAddressId(), "recipientAddressId is required");
        Address recipient = addressRepository.findById(recipientId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Recipient address not found",
                ErrorCode.ADDRESS_NOT_FOUND
            ));

        // 3) agences
        Agency originAgency = null;
        if (request.getOriginAgencyId() != null) {
            UUID originId = request.getOriginAgencyId();
            Objects.requireNonNull(originId, "originAgencyId is required");
            originAgency = agencyRepository.findById(originId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Origin agency not found",
                    ErrorCode.AGENCY_NOT_FOUND
                ));
        }

        Agency destinationAgency = null;
        if (request.getDestinationAgencyId() != null) {
            UUID destId = request.getDestinationAgencyId();
            Objects.requireNonNull(destId, "destinationAgencyId is required");
            destinationAgency = agencyRepository.findById(destId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Destination agency not found",
                    ErrorCode.AGENCY_NOT_FOUND
                ));
        }

        // 4) Tracking number
        String trackingRef = generateTrackingRef();

        // Generate PARTIAL QR payload (two-step workflow)
        String partialQrPayload = trackingRef + "|PARTIAL|" + Instant.now().toEpochMilli();

        // 5) créer Parcel
        Parcel parcel = Parcel.builder()
                .id(UUID.randomUUID())
                .trackingRef(trackingRef)
            .trackingNumber(trackingRef)
                .client(client)
                .senderAddress(sender)
                .recipientAddress(recipient)
                .originAgency(originAgency)
                .destinationAgency(destinationAgency)
            .weight(request.getWeight())
            .dimensions(request.getDimensions())
            .declaredValue(request.getDeclaredValue())
            .fragile(request.isFragile())
            .serviceType(request.getServiceType())
            .deliveryOption(request.getDeliveryOption())
            .paymentOption(request.getPaymentOption())
            .photoUrl(request.getPhotoUrl())
            .descriptionComment(request.getDescriptionComment())
            .partialQrCode(partialQrPayload)
                .build();

        @SuppressWarnings("null")
        Parcel savedParcel = parcelRepository.save(parcel);
        parcel = savedParcel;

        return toResponse(parcel);
    }

    // ================== GET BY ID ==================
    @Override
        public ParcelDetailResponse getParcelById(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        // contrôle d’accès basique :
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() == UserRole.CLIENT &&
                !parcel.getClient().getId().equals(user.getEntityId())) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "You cannot access this parcel");
        }

        return toDetailResponse(parcel);
    }

    // ================== GET BY TRACKING ==================
    @Override
    public ParcelDetailResponse getParcelByTracking(String trackingRef) {
        Parcel parcel = parcelRepository.findByTrackingRef(trackingRef)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        // même contrôle que ci-dessus
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() == UserRole.CLIENT &&
                !parcel.getClient().getId().equals(user.getEntityId())) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "You cannot access this parcel");
        }

        return toDetailResponse(parcel);
    }

    // ================== LIST MY PARCELS ==================
    @Override
    public Page<ParcelResponse> listMyParcels(int page, int size) {
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Current user is not a client");
        }

        UUID clientId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
        return parcelRepository.findByClient_Id(clientId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== LIST ALL (ADMIN/STAFF) ==================
    @Override
    public Page<ParcelResponse> listParcels(int page, int size) {
        // Admin/Staff only - role check enforced via SecurityConfig
        return parcelRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== UPDATE STATUS ==================
    @Override
        public ParcelResponse updateParcelStatus(UUID parcelId, UpdateParcelStatusRequest request) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        ParcelStatus current = parcel.getStatus();
        ParcelStatus next = request.getStatus();

        validateStatusTransition(current, next);

        // Enforce: every status change must have a ScanEvent (GPS required)
        ScanEventCreateRequest evt = new ScanEventCreateRequest();
        evt.setParcelId(id);
        evt.setEventType(next.name());
        evt.setLatitude(request.getLatitude());
        evt.setLongitude(request.getLongitude());
        evt.setLocationSource(request.getLocationSource());
        evt.setDeviceTimestamp(request.getDeviceTimestamp());
        evt.setLocationNote(request.getLocationNote());
        evt.setComment(request.getComment());
        evt.setProofUrl(request.getProofUrl());

        scanEventService.recordScanEvent(evt);

        Parcel refreshed = parcelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Parcel not found",
                ErrorCode.PARCEL_NOT_FOUND
            ));
        return toResponse(refreshed);
    }

    // ================== ACCEPT PARCEL (CREATED -> ACCEPTED) ==================
    @Override
    public ParcelResponse acceptParcel(UUID parcelId) {
        // Compatibility endpoint: acceptance requires GPS-backed ScanEvent.
        throw new AuthException(
            ErrorCode.VALIDATION_FAILED,
            "Acceptance requires GPS. Use PATCH /api/parcels/{parcelId}/validate with latitude/longitude."
        );
    }

    // ================== ACCEPT PARCEL WITH VALIDATION (CREATED -> ACCEPTED) ==================
    // Agent/Courier validates parcel details: description, weight, adds photo and comments
    @Override
    public ParcelResponse acceptParcelWithValidation(@Nullable UUID parcelId, AcceptParcelRequest request) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        // 1) Parcel must be in CREATED state
        if (parcel.getStatus() != ParcelStatus.CREATED) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Parcel must be in CREATED state to be accepted. Current: " + parcel.getStatus()
            );
        }

        // 2) Description must be confirmed by the agent
        if (!request.isDescriptionConfirmed()) {
            throw new AuthException(
                    ErrorCode.VALIDATION_FAILED,
                    "Agent must confirm the parcel description is accurate before acceptance"
            );
        }

        // 3) Get the current staff (agent/courier) who is validating
        UserAccount currentUser = getCurrentUserAccount();
        Staff validatingStaff = null;
        if (currentUser.getRole() == UserRole.AGENT || currentUser.getRole() == UserRole.COURIER) {
            UUID validatingStaffId = currentUser.getEntityId();
            if (validatingStaffId != null) {
                validatingStaff = staffRepository.findById(validatingStaffId).orElse(null);
            } else {
                validatingStaff = null;
            }
        }

        // 4) Store original weight for price recalculation check
        Double originalWeight = parcel.getWeight();
        boolean weightChanged = false;

        // 5) Update validated weight if provided and different
        if (request.getValidatedWeight() != null && request.getValidatedWeight() > 0) {
            parcel.setValidatedWeight(request.getValidatedWeight());
            if (!request.getValidatedWeight().equals(originalWeight)) {
                weightChanged = true;
                // Optionally update the main weight to the validated weight
                parcel.setWeight(request.getValidatedWeight());
            }
        } else {
            // Agent confirms original weight is correct
            parcel.setValidatedWeight(parcel.getWeight());
        }

        // 6) Update validated dimensions if provided
        if (request.getValidatedDimensions() != null && !request.getValidatedDimensions().isBlank()) {
            parcel.setValidatedDimensions(request.getValidatedDimensions());
        } else {
            parcel.setValidatedDimensions(parcel.getDimensions());
        }

        // 7) Set photo URL if provided
        if (request.getPhotoUrl() != null && !request.getPhotoUrl().isBlank()) {
            parcel.setPhotoUrl(request.getPhotoUrl());
        }

        // 8) Set validation comment
        if (request.getValidationComment() != null && !request.getValidationComment().isBlank()) {
            parcel.setValidationComment(request.getValidationComment());
        }

        // 9) Set validation metadata
        parcel.setDescriptionConfirmed(true);
        parcel.setValidatedAt(Instant.now());
        parcel.setValidatedBy(validatingStaff);

        Parcel saved = parcelRepository.save(parcel);
        parcel = Objects.requireNonNull(saved, "failed to save parcel");

        // 10) Enforce: status transition CREATED -> ACCEPTED must be backed by a ScanEvent
        ScanEventCreateRequest evt = new ScanEventCreateRequest();
        evt.setParcelId(id);
        evt.setEventType(ScanEventType.ACCEPTED.name());
        evt.setLatitude(request.getLatitude());
        evt.setLongitude(request.getLongitude());
        evt.setLocationSource(request.getLocationSource());
        evt.setDeviceTimestamp(request.getDeviceTimestamp());
        evt.setLocationNote(request.getLocationNote());
        evt.setComment(request.getValidationComment());
        evt.setProofUrl(request.getPhotoUrl());

        scanEventService.recordScanEvent(evt);

        // 11) If weight changed and recalculation requested, trigger price recalculation
        if (weightChanged && request.isRecalculatePriceOnWeightChange()) {
            try {
                pricingService.recalculatePriceForParcel(id);
            } catch (Exception e) {
                // Log but don't fail the acceptance
                // Price can be manually adjusted later
            }
        }

        // 12) Notify client that parcel has been validated/accepted
        notificationService.notifyParcelAccepted(parcel);

        Parcel refreshed = parcelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Parcel not found",
                ErrorCode.PARCEL_NOT_FOUND
            ));
        return toResponse(refreshed);
    }

    // ================== CHANGE DELIVERY OPTION (AGENCY ↔ HOME) ==================
    @Override
    public ParcelResponse changeDeliveryOption(@Nullable UUID parcelId, ChangeDeliveryOptionRequest request) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        if (parcel.getStatus() == ParcelStatus.DELIVERED
                || parcel.getStatus() == ParcelStatus.RETURNED
                || parcel.getStatus() == ParcelStatus.CANCELLED) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Cannot change delivery option for a final parcel"
            );
        }

        DeliveryOption oldOption = parcel.getDeliveryOption();
        DeliveryOption newOption = request.getNewDeliveryOption();

        parcel.setDeliveryOption(newOption);
        parcel = Objects.requireNonNull(parcelRepository.save(parcel), "failed to save parcel");

        // 💰 SPRINT 14: supplément si AGENCY -> HOME avec additionalAmount
        if (oldOption == DeliveryOption.AGENCY
                && newOption == DeliveryOption.HOME
                && request.getAdditionalAmount() != null) {
            paymentService.handleAdditionalDeliveryCharge(id, request.getAdditionalAmount());
        }

        return toResponse(parcel);
    }

    // ================== UPDATE METADATA (photo + commentaire) ==================
    @Override
    public ParcelResponse updateParcelMetadata(@Nullable UUID parcelId, UpdateParcelMetadataRequest request) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        if (request.getPhotoUrl() != null && !request.getPhotoUrl().isBlank()) {
            parcel.setPhotoUrl(request.getPhotoUrl());
        }
        if (request.getDescriptionComment() != null && !request.getDescriptionComment().isBlank()) {
            parcel.setDescriptionComment(request.getDescriptionComment());
        }

        @SuppressWarnings("null")
        Parcel saved = parcelRepository.save(parcel);
        parcel = saved;
        return toResponse(parcel);
    }

    // ================== STATUS RULES ==================
    private void validateStatusTransition(ParcelStatus current, ParcelStatus next) {

        if (current == next) return;

        // états finaux : pas de retour en arrière
        if (current == ParcelStatus.DELIVERED
                || current == ParcelStatus.RETURNED
                || current == ParcelStatus.CANCELLED) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Cannot change status from a final state: " + current
            );
        }

        // Annulation ou retour toujours possibles (avant d’être final)
        if (next == ParcelStatus.CANCELLED || next == ParcelStatus.RETURNED) {
            return;
        }

        // règle simple : progression "en avant" (basée sur l’ordre de l’enum)
        if (next.ordinal() < current.ordinal()) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Invalid status transition: " + current + " -> " + next
            );
        }
    }

    // ================== TRACKING REF ==================
    private String generateTrackingRef() {
        // Ex: SCM-2025-123456
        String ref;
        do {
            int randomPart = random.nextInt(1_000_000); // 0–999999
            ref = "SCM-" + Instant.now().toString().substring(0, 10).replace("-", "")
                    + "-" + String.format("%06d", randomPart);
        } while (parcelRepository.existsByTrackingRef(ref));
        return ref;
    }

    // ================== CURRENT USER ==================
    private UserAccount getCurrentUserAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Unauthenticated");
        }

        String subject = auth.getName(); // "sub" du JWT (userId ou phone)

        try {
            UUID userId = UUID.fromString(subject);
            UUID nonNullUserId = Objects.requireNonNull(userId);
            return userAccountRepository.findById(nonNullUserId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        } catch (IllegalArgumentException ex) {
            // pas un UUID, on considère que c'est le phone
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        }
    }

    // ================== MAPPERS ==================
    private ParcelResponse toResponse(Parcel parcel) {
        return ParcelResponse.builder()
                .id(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .trackingNumber(parcel.getTrackingNumber() != null ? parcel.getTrackingNumber() : parcel.getTrackingRef())
                .status(parcel.getStatus())
                .serviceType(parcel.getServiceType())
                .deliveryOption(parcel.getDeliveryOption())
                .weight(parcel.getWeight())
                .clientId(parcel.getClient().getId())
                .senderAddressId(parcel.getSenderAddress().getId())
                .recipientAddressId(parcel.getRecipientAddress().getId())

                // 🔥 SPRINT 14: nouveaux champs
                .paymentOption(parcel.getPaymentOption())
                .photoUrl(parcel.getPhotoUrl())
                .descriptionComment(parcel.getDescriptionComment())
                .qrStatus(parcel.getQrStatus())
                .locked(parcel.isLocked())
                // -----------------------------

                .createdAt(parcel.getCreatedAt())
                .expectedDeliveryAt(parcel.getExpectedDeliveryAt())
                .build();
    }

    private ParcelDetailResponse toDetailResponse(Parcel parcel) {
        Address sender = parcel.getSenderAddress();
        Address recipient = parcel.getRecipientAddress();
        Agency origin = parcel.getOriginAgency();
        Agency dest = parcel.getDestinationAgency();
        Client client = parcel.getClient();

        // 🔹 Récupérer l’historique de pricing pour ce colis
        var pricingDetails = pricingDetailRepository
                .findByParcel_IdOrderByAppliedAtAsc(parcel.getId());

        Double lastPrice = null;
        if (!pricingDetails.isEmpty()) {
            lastPrice = pricingDetails
                    .get(pricingDetails.size() - 1)
                    .getAppliedPrice();
        }

        List<PricingDetailResponse> pricingHistory = pricingDetails.stream()
                .map(detail -> {
                    Tariff t = detail.getTariff();
                    return PricingDetailResponse.builder()
                            .id(detail.getId())
                            .parcelId(parcel.getId())
                            .tariffId(t.getId())
                            .serviceType(t.getServiceType().name())
                            .originZone(t.getOriginZone())
                            .destinationZone(t.getDestinationZone())
                            .weightBracket(t.getWeightBracket())
                            .appliedPrice(detail.getAppliedPrice())
                            .appliedAt(detail.getAppliedAt())
                            .build();
                })
                .toList();

        return ParcelDetailResponse.builder()
                .id(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
            .trackingNumber(parcel.getTrackingNumber() != null ? parcel.getTrackingNumber() : parcel.getTrackingRef())
                .status(parcel.getStatus())
                .serviceType(parcel.getServiceType())
                .deliveryOption(parcel.getDeliveryOption())
            .paymentOption(parcel.getPaymentOption())
            .descriptionComment(parcel.getDescriptionComment())
            .qrStatus(parcel.getQrStatus())
            .locked(parcel.isLocked())
            .partialQrCode(parcel.getPartialQrCode())
            .finalQrCode(parcel.getFinalQrCode())
                .weight(parcel.getWeight())
                .dimensions(parcel.getDimensions())
                .declaredValue(parcel.getDeclaredValue())
                .fragile(parcel.isFragile())
                .createdAt(parcel.getCreatedAt())
                .expectedDeliveryAt(parcel.getExpectedDeliveryAt())

                .clientId(client.getId())
                .clientName(client.getFullName())

                .senderAddressId(sender.getId())
                .senderLabel(sender.getLabel())
                .senderCity(sender.getCity())
                .senderRegion(sender.getRegion())
                .senderCountry(sender.getCountry())

                .recipientAddressId(recipient.getId())
                .recipientLabel(recipient.getLabel())
                .recipientCity(recipient.getCity())
                .recipientRegion(recipient.getRegion())
                .recipientCountry(recipient.getCountry())

                .originAgencyId(origin != null ? origin.getId() : null)
                .originAgencyName(origin != null ? origin.getAgencyName() : null)
                .destinationAgencyId(dest != null ? dest.getId() : null)
                .destinationAgencyName(dest != null ? dest.getAgencyName() : null)

                // 🔹 champs pricing (ajoutés dans ParcelDetailResponse)
                .lastAppliedPrice(lastPrice)
                .pricingHistory(pricingHistory)
                .build();
    }

    // ================== QR TWO-STEP WORKFLOW (SPEC SECTION 3) ==================

    /**
     * Correct parcel metadata before final validation.
     * Only allowed while QR status is PARTIAL (not yet validated/locked).
     */
    @Override
    public ParcelResponse correctParcelBeforeValidation(UUID parcelId, 
                                                         ParcelCorrectionRequest request) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        // Only allow corrections when parcel is not locked (QR status = PARTIAL)
        if (parcel.isLocked()) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Cannot correct parcel after validation. Parcel is locked."
            );
        }

        // Corrections only allowed in early statuses
        if (parcel.getStatus() != ParcelStatus.CREATED && 
            parcel.getStatus() != ParcelStatus.ACCEPTED) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Corrections only allowed in CREATED or ACCEPTED status. Current: " + parcel.getStatus()
            );
        }

        // Apply corrections
        if (request.getWeight() != null) {
            parcel.setWeight(request.getWeight());
        }
        if (request.getDimensions() != null && !request.getDimensions().isBlank()) {
            parcel.setDimensions(request.getDimensions());
        }
        if (request.getDescriptionComment() != null && !request.getDescriptionComment().isBlank()) {
            parcel.setDescriptionComment(request.getDescriptionComment());
        } else if (request.getDescription() != null && !request.getDescription().isBlank()) {
            // Backward/alias support: request.description maps to the persisted descriptionComment field.
            parcel.setDescriptionComment(request.getDescription());
        }
        if (request.getDeclaredValue() != null) {
            parcel.setDeclaredValue(request.getDeclaredValue());
        }
        if (request.getFragile() != null) {
            parcel.setFragile(request.getFragile());
        }
        if (request.getCorrectionReason() != null && !request.getCorrectionReason().isBlank()) {
            parcel.setValidationComment(request.getCorrectionReason());
        }

        Parcel saved = Objects.requireNonNull(parcelRepository.save(parcel), "failed to save parcel");
        return toResponse(saved);
    }

    /**
     * Validate and lock parcel - generates final QR code.
     * After this, no more corrections are allowed.
     * GPS coordinates are mandatory for validation.
     */
    @Override
    public ParcelResponse validateAndLockParcel(UUID parcelId,
                                                 Double latitude,
                                                 Double longitude) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(latitude, "GPS latitude is mandatory for validation");
        Objects.requireNonNull(longitude, "GPS longitude is mandatory for validation");

        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        if (parcel.isLocked()) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Parcel is already validated and locked"
            );
        }

        // Must be in ACCEPTED status to validate
        if (parcel.getStatus() != ParcelStatus.ACCEPTED) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Parcel must be ACCEPTED before validation. Current: " + parcel.getStatus()
            );
        }

        // Lock the parcel
        parcel.setLocked(true);
        parcel.setQrStatus(com.smartcampost.backend.model.enums.QrStatus.FINAL);
        parcel.setValidatedAt(Instant.now());

        // Store validation GPS coordinates
        parcel.setCreationLatitude(latitude);
        parcel.setCreationLongitude(longitude);

        // Generate FINAL secure QR content (anti-forgery payload).
        // Prefer existing token if already generated to avoid invalidating printed labels.
        SecureQrPayload finalPayload;
        java.util.Optional<QrVerificationToken> existing = qrSecurityService.getValidTokenForParcel(parcel.getId());
        if (existing.isPresent()) {
            QrVerificationToken token = existing.get();
            long ts = token.getCreatedAt() != null ? token.getCreatedAt().getEpochSecond() : Instant.now().getEpochSecond();
            String fullSig = token.getSignature();
            String truncatedSig = (fullSig != null && fullSig.length() > 16) ? fullSig.substring(0, 16) : fullSig;
            finalPayload = SecureQrPayload.builder()
                    .version(1)
                    .type("P")
                    .token(token.getToken())
                    .ref(parcel.getTrackingRef())
                    .ts(ts)
                    .sig(truncatedSig)
                    .build();
        } else {
            finalPayload = qrSecurityService.generatePermanentToken(parcel);
        }
        parcel.setFinalQrCode(finalPayload.toCompactString());

        // Get validating staff
        UserAccount currentUser = getCurrentUserAccount();
        if (currentUser.getRole() == UserRole.AGENT || currentUser.getRole() == UserRole.COURIER) {
            UUID staffId = currentUser.getEntityId();
            if (staffId != null) {
                Staff validatingStaff = staffRepository.findById(staffId).orElse(null);
                parcel.setValidatedBy(validatingStaff);
            }
        }

        Parcel saved = Objects.requireNonNull(parcelRepository.save(parcel), "failed to save parcel");

        // Audited scan event (neutral - does not change status)
        try {
            ScanEventCreateRequest auditEvt = new ScanEventCreateRequest();
            auditEvt.setParcelId(id);
            auditEvt.setEventType(ScanEventType.PROOF_CAPTURED.name());
            auditEvt.setLatitude(latitude);
            auditEvt.setLongitude(longitude);
            auditEvt.setLocationSource("DEVICE_GPS");
            auditEvt.setDeviceTimestamp(Instant.now());
            auditEvt.setComment("FINAL_QR_VALIDATED_AND_LOCKED");
            scanEventService.recordScanEvent(auditEvt);
        } catch (Exception ignored) {
            // audit best-effort; lock must still succeed
        }

        // Notify client of successful validation
        notificationService.notifyParcelAccepted(saved);

        return toResponse(saved);
    }

    @Override
    public ParcelResponse adminOverrideLockedParcel(UUID parcelId,
                                                    AdminParcelOverrideRequest request) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(request, "request is required");

        UserAccount current = getCurrentUserAccount();
        if (current.getRole() != UserRole.ADMIN) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Admin role required");
        }

        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        if (!parcel.isLocked()) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Parcel is not locked; use normal correction flow"
            );
        }

        if (request.getDescriptionComment() != null && !request.getDescriptionComment().isBlank()) {
            parcel.setDescriptionComment(request.getDescriptionComment());
        }
        if (request.getDeclaredValue() != null) {
            parcel.setDeclaredValue(request.getDeclaredValue());
        }
        if (request.getFragile() != null) {
            parcel.setFragile(request.getFragile());
        }

        Parcel saved = Objects.requireNonNull(parcelRepository.save(parcel), "failed to save parcel");

        // Mandatory audited scan event (neutral)
        ScanEventCreateRequest auditEvt = new ScanEventCreateRequest();
        auditEvt.setParcelId(id);
        auditEvt.setEventType(ScanEventType.PROOF_CAPTURED.name());
        auditEvt.setLatitude(request.getLatitude());
        auditEvt.setLongitude(request.getLongitude());
        auditEvt.setLocationSource(request.getLocationSource());
        auditEvt.setDeviceTimestamp(request.getDeviceTimestamp());
        auditEvt.setLocationNote(request.getLocationNote());
        auditEvt.setProofUrl(request.getProofUrl());
        String reason = request.getReason();
        auditEvt.setComment("ADMIN_OVERRIDE_LOCKED_PARCEL: " + reason + (request.getComment() != null ? (" | " + request.getComment()) : ""));

        scanEventService.recordScanEvent(auditEvt);

        return toResponse(saved);
    }

    /**
     * Check if parcel can still be corrected (not yet locked).
     */
    @Override
        public boolean canCorrectParcel(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        // Can correct if not locked and in early status
        return !parcel.isLocked() && 
               (parcel.getStatus() == ParcelStatus.CREATED || 
                parcel.getStatus() == ParcelStatus.ACCEPTED);
    }
}
