package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.parcel.*;
import com.smartcampost.backend.dto.pricing.PricingDetailResponse;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.*;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.ParcelService;
import com.smartcampost.backend.service.PaymentService;
import com.smartcampost.backend.service.PricingService;
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

        // 5) créer Parcel
        Parcel parcel = Parcel.builder()
                .id(UUID.randomUUID())
                .trackingRef(trackingRef)
                .client(client)
                .senderAddress(sender)
                .recipientAddress(recipient)
                .originAgency(originAgency)
                .destinationAgency(destinationAgency)
                .build();

        Parcel savedParcel = parcelRepository.save(parcel);
        parcel = Objects.requireNonNull(savedParcel, "failed to save parcel");

        return toResponse(parcel);
    }

    // ================== GET BY ID ==================
    @Override
    public ParcelDetailResponse getParcelById(@org.springframework.lang.NonNull UUID parcelId) {
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
    public ParcelResponse updateParcelStatus(@org.springframework.lang.NonNull UUID parcelId, UpdateParcelStatusRequest request) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        ParcelStatus current = parcel.getStatus();
        ParcelStatus next = request.getStatus();

        validateStatusTransition(current, next);

        parcel.setStatus(next);
        Parcel saved = parcelRepository.save(parcel);
        parcel = Objects.requireNonNull(saved, "failed to save parcel");

        return toResponse(parcel);
    }

    // ================== ACCEPT PARCEL (CREATED -> ACCEPTED) ==================
    @Override
    public ParcelResponse acceptParcel(@org.springframework.lang.NonNull UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        if (parcel.getStatus() != ParcelStatus.CREATED) {
            throw new AuthException(
                    ErrorCode.PARCEL_STATUS_INVALID,
                    "Parcel must be in CREATED state to be accepted"
            );
        }

        parcel.setStatus(ParcelStatus.ACCEPTED);
        Parcel saved = parcelRepository.save(parcel);
        parcel = Objects.requireNonNull(saved, "failed to save parcel");

        return toResponse(parcel);
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

        // 10) Update status to ACCEPTED
        parcel.setStatus(ParcelStatus.ACCEPTED);

        Parcel saved = parcelRepository.save(parcel);
        parcel = Objects.requireNonNull(saved, "failed to save parcel");

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

        return toResponse(parcel);
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

        Parcel saved = parcelRepository.save(parcel);
        parcel = Objects.requireNonNull(saved, "failed to save parcel");
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
                .status(parcel.getStatus())
                .serviceType(parcel.getServiceType())
                .deliveryOption(parcel.getDeliveryOption())
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
}
