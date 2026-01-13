package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.delivery.*;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.model.enums.*;
import com.smartcampost.backend.repository.*;
import com.smartcampost.backend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryServiceImpl implements DeliveryService {

    private final ParcelRepository parcelRepository;
    private final CourierRepository courierRepository;
    private final DeliveryProofRepository deliveryProofRepository;
    private final PricingDetailRepository pricingDetailRepository;
    private final PaymentRepository paymentRepository;
    private final UserAccountRepository userAccountRepository;
    private final ScanEventRepository scanEventRepository;

    private final DeliveryOtpService deliveryOtpService;
    private final DeliveryProofService deliveryProofService;
    private final NotificationService notificationService;
    private final PaymentService paymentService;
    private final ScanEventService scanEventService;

    // ==================== START DELIVERY ====================

    @Override
    @Transactional
    public StartDeliveryResponse startDelivery(StartDeliveryRequest request) {
        // Get parcel
        Parcel parcel = getParcel(request.getParcelId(), request.getTrackingRef());

        // Verify parcel is ready for delivery (at destination or in transit)
        validateForDelivery(parcel);

        // Get or validate courier
        Courier courier = null;
        if (request.getCourierId() != null) {
            courier = courierRepository.findById(request.getCourierId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Courier not found", ErrorCode.COURIER_NOT_FOUND));
        }

        // Update parcel status to OUT_FOR_DELIVERY
        parcel.setStatus(ParcelStatus.OUT_FOR_DELIVERY);
        parcelRepository.save(parcel);

        // Record scan event
        recordScanEvent(parcel, ScanEventType.OUT_FOR_DELIVERY, request.getNotes());

        // Send OTP to recipient for home delivery
        // Use the client's phone since Address doesn't have phone
        Address recipient = parcel.getRecipientAddress();
        Client client = parcel.getClient();
        boolean otpSent = false;
        String otpSentTo = null;
        String clientPhone = client != null ? client.getPhone() : null;

        if (parcel.getDeliveryOption() == DeliveryOption.HOME && clientPhone != null) {
            try {
                deliveryOtpService.sendDeliveryOtp(parcel.getId(), clientPhone);
                otpSent = true;
                otpSentTo = maskPhoneNumber(clientPhone);
            } catch (Exception e) {
                log.warn("Failed to send delivery OTP: {}", e.getMessage());
            }
        }

        // Notify recipient
        notificationService.notifyParcelOutForDelivery(parcel);

        Instant now = Instant.now();

        return StartDeliveryResponse.builder()
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .status(parcel.getStatus().name())
                .recipientName(recipient != null ? recipient.getLabel() : null)
                .recipientPhone(clientPhone != null ? maskPhoneNumber(clientPhone) : null)
                .recipientAddress(formatAddress(recipient))
                .recipientLatitude(recipient != null && recipient.getLatitude() != null ? recipient.getLatitude().doubleValue() : null)
                .recipientLongitude(recipient != null && recipient.getLongitude() != null ? recipient.getLongitude().doubleValue() : null)
                .courierId(courier != null ? courier.getId() : null)
                .courierName(courier != null ? courier.getFullName() : null)
                .otpSent(otpSent)
                .otpSentTo(otpSentTo)
                .startedAt(now)
                .expectedDeliveryAt(parcel.getExpectedDeliveryAt())
                .recipientNotified(true)
                .build();
    }

    // ==================== SEND DELIVERY OTP ====================

    @Override
    public void sendDeliveryOtp(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Use client phone since Address doesn't have phone
        Client client = parcel.getClient();
        if (client == null || client.getPhone() == null) {
            throw new AuthException(ErrorCode.VALIDATION_ERROR,
                    "Recipient phone number not available");
        }

        deliveryOtpService.sendDeliveryOtp(parcelId, client.getPhone());
    }

    // ==================== COMPLETE DELIVERY ====================

    @Override
    @Transactional
    public CompleteDeliveryResponse completeDelivery(CompleteDeliveryRequest request) {
        // Get parcel
        Parcel parcel = getParcel(request.getParcelId(), request.getTrackingRef());

        // Verify parcel is out for delivery
        if (parcel.getStatus() != ParcelStatus.OUT_FOR_DELIVERY) {
            throw new AuthException(ErrorCode.PARCEL_STATUS_INVALID,
                    "Parcel must be OUT_FOR_DELIVERY to complete. Current: " + parcel.getStatus());
        }

        Instant now = Instant.now();
        UserAccount currentUser = getCurrentUser();

        // Verify OTP for home delivery
        if (parcel.getDeliveryOption() == DeliveryOption.HOME) {
            if (request.getOtpCode() == null || request.getOtpCode().isEmpty()) {
                throw new AuthException(ErrorCode.OTP_INVALID,
                        "OTP code is required for home delivery");
            }

            boolean otpValid = deliveryOtpService.validateDeliveryOtp(
                    parcel.getId(), request.getOtpCode());
            if (!otpValid) {
                throw new AuthException(ErrorCode.OTP_INVALID, "Invalid OTP code");
            }
        }

        // Capture proof of delivery
        DeliveryProofType proofType = request.getProofType() != null ?
                request.getProofType() : DeliveryProofType.OTP;

        String proofDetails = buildProofDetails(request);
        String capturedBy = currentUser.getEntityId() != null ?
                currentUser.getEntityId().toString() : currentUser.getId().toString();

        DeliveryProof proof = deliveryProofService.captureProof(
                parcel.getId(), proofType, proofDetails, capturedBy);

        // Handle COD payment if needed
        UUID paymentId = null;
        if (request.isPaymentCollected() && request.getAmountCollected() != null) {
            try {
                PaymentMethod method = request.getPaymentMethod() != null ?
                        PaymentMethod.valueOf(request.getPaymentMethod()) : PaymentMethod.CASH;
                // Payment would be created here
                log.info("COD payment collected: {} XAF via {}",
                        request.getAmountCollected(), method);
            } catch (Exception e) {
                log.warn("Failed to record COD payment: {}", e.getMessage());
            }
        }

        // Update parcel status to DELIVERED
        parcel.setStatus(ParcelStatus.DELIVERED);
        parcelRepository.save(parcel);

        // Record scan event
        recordScanEvent(parcel, ScanEventType.DELIVERED, request.getNotes());

        // Notify client
        notificationService.notifyParcelDelivered(parcel);

        // Get courier info
        Courier courier = null;
        if (proof.getCourier() != null) {
            courier = proof.getCourier();
        }

        return CompleteDeliveryResponse.builder()
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .status(parcel.getStatus().name())
                .proofId(proof.getId())
                .proofType(proof.getProofType().name())
                .proofDetails(proof.getDetails())
                .proofTimestamp(proof.getTimestamp())
                .receiverName(request.getReceiverName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .paymentCollected(request.isPaymentCollected())
                .amountCollected(request.getAmountCollected())
                .paymentId(paymentId)
                .courierId(courier != null ? courier.getId() : null)
                .courierName(courier != null ? courier.getFullName() : null)
                .clientNotified(true)
                .receiptGenerated(false) // TODO: Implement receipt generation
                .deliveredAt(now)
                .build();
    }

    // ==================== GET DELIVERY STATUS ====================

    @Override
    public DeliveryStatusResponse getDeliveryStatus(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        Address recipient = parcel.getRecipientAddress();
        Agency destAgency = parcel.getDestinationAgency();

        // Get delivery proof if exists
        Optional<DeliveryProof> proofOpt = deliveryProofRepository.findByParcel(parcel);

        // Get pricing for payment info - use correct method
        Optional<PricingDetail> pricingOpt = pricingDetailRepository.findTopByParcel_IdOrderByAppliedAtDesc(parcelId);
        List<Payment> payments = paymentRepository.findByParcel_IdOrderByTimestampDesc(parcelId);

        double amountDue = pricingOpt.map(PricingDetail::getAppliedPrice).orElse(0.0);
        double amountPaid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount)
                .sum();

        boolean paymentRequired = parcel.getPaymentOption() == PaymentOption.COD;
        boolean paymentCollected = paymentRequired && amountPaid >= amountDue;

        // Determine current stage
        String currentStage = determineDeliveryStage(parcel);

        return DeliveryStatusResponse.builder()
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .status(parcel.getStatus().name())
                .deliveryOption(parcel.getDeliveryOption().name())
                .currentStage(currentStage)
                .currentAgencyName(destAgency != null ? destAgency.getAgencyName() : null)
                .recipientName(recipient != null ? recipient.getLabel() : null)
                .recipientCity(recipient != null ? recipient.getCity() : null)
                .attemptCount(0) // TODO: Track delivery attempts
                .attempts(new ArrayList<>())
                .proofId(proofOpt.map(DeliveryProof::getId).orElse(null))
                .proofType(proofOpt.map(p -> p.getProofType().name()).orElse(null))
                .deliveredAt(proofOpt.map(DeliveryProof::getTimestamp).orElse(null))
                .paymentRequired(paymentRequired)
                .amountDue(amountDue)
                .paymentCollected(paymentCollected)
                .build();
    }

    // ==================== MARK DELIVERY FAILED ====================

    @Override
    @Transactional
    public DeliveryStatusResponse markDeliveryFailed(UUID parcelId, String reason) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Record the failed attempt
        recordScanEvent(parcel, ScanEventType.ARRIVED_DESTINATION,
                "Delivery attempt failed: " + reason);

        // Parcel stays at OUT_FOR_DELIVERY or goes back to ARRIVED_HUB
        if (parcel.getStatus() == ParcelStatus.OUT_FOR_DELIVERY) {
            parcel.setStatus(ParcelStatus.ARRIVED_HUB);
            parcelRepository.save(parcel);
        }

        log.info("Delivery marked as failed for parcel {}: {}", parcelId, reason);

        return getDeliveryStatus(parcelId);
    }

    // ==================== RESCHEDULE DELIVERY ====================

    @Override
    @Transactional
    public DeliveryStatusResponse rescheduleDelivery(UUID parcelId, RescheduleDeliveryRequest request) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Update expected delivery date
        if (request.getNewDate() != null) {
            parcel.setExpectedDeliveryAt(
                    request.getNewDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
            parcelRepository.save(parcel);
        }

        log.info("Delivery rescheduled for parcel {} to {}",
                parcelId, request.getNewDate());

        // TODO: Notify recipient about rescheduled delivery

        return getDeliveryStatus(parcelId);
    }

    // ==================== PRIVATE HELPERS ====================

    private Parcel getParcel(UUID parcelId, String trackingRef) {
        if (parcelId != null) {
            return parcelRepository.findById(parcelId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        } else if (trackingRef != null && !trackingRef.isEmpty()) {
            return parcelRepository.findByTrackingRef(trackingRef)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        } else {
            throw new AuthException(ErrorCode.VALIDATION_ERROR,
                    "Either parcelId or trackingRef must be provided");
        }
    }

    private void validateForDelivery(Parcel parcel) {
        ParcelStatus status = parcel.getStatus();
        if (status == ParcelStatus.DELIVERED) {
            throw new AuthException(ErrorCode.PARCEL_STATUS_INVALID,
                    "Parcel is already delivered");
        }
        if (status == ParcelStatus.CANCELLED || status == ParcelStatus.RETURNED) {
            throw new AuthException(ErrorCode.PARCEL_STATUS_INVALID,
                    "Parcel is " + status + " and cannot be delivered");
        }
        if (status == ParcelStatus.CREATED) {
            throw new AuthException(ErrorCode.PARCEL_STATUS_INVALID,
                    "Parcel has not been accepted yet");
        }
    }

    private void recordScanEvent(Parcel parcel, ScanEventType eventType, String notes) {
        try {
            ScanEvent event = ScanEvent.builder()
                    .id(UUID.randomUUID())
                    .parcel(parcel)
                    .eventType(eventType)
                    .timestamp(Instant.now())
                    .locationNote(notes)
                    .build();
            scanEventRepository.save(event);
        } catch (Exception e) {
            log.warn("Failed to record scan event: {}", e.getMessage());
        }
    }

    private String buildProofDetails(CompleteDeliveryRequest request) {
        StringBuilder details = new StringBuilder();
        if (request.getReceiverName() != null) {
            details.append("Receiver: ").append(request.getReceiverName());
        }
        if (request.getReceiverRelation() != null) {
            details.append(" (").append(request.getReceiverRelation()).append(")");
        }
        if (request.getLatitude() != null && request.getLongitude() != null) {
            details.append(" | GPS: ").append(request.getLatitude())
                    .append(",").append(request.getLongitude());
        }
        if (request.getPhotoUrl() != null) {
            details.append(" | Photo: ").append(request.getPhotoUrl());
        }
        return details.toString();
    }

    private String determineDeliveryStage(Parcel parcel) {
        return switch (parcel.getStatus()) {
            case CREATED -> "Pending acceptance";
            case ACCEPTED -> "At origin agency";
            case IN_TRANSIT -> "In transit";
            case ARRIVED_HUB -> "At destination agency";
            case OUT_FOR_DELIVERY -> "Out for delivery";
            case DELIVERED -> "Delivered";
            case RETURNED -> "Returned to sender";
            case CANCELLED -> "Cancelled";
        };
    }

    private String formatAddress(Address address) {
        if (address == null) return null;
        StringBuilder sb = new StringBuilder();
        if (address.getLabel() != null) sb.append(address.getLabel());
        if (address.getCity() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(address.getCity());
        }
        if (address.getRegion() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(address.getRegion());
        }
        return sb.toString();
    }

    private String maskPhoneNumber(String phone) {
        if (phone == null || phone.length() < 4) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 2);
    }

    private UserAccount getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Unauthenticated");
        }

        String subject = auth.getName();
        try {
            UUID userId = UUID.fromString(subject);
            return userAccountRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found", ErrorCode.AUTH_USER_NOT_FOUND));
        } catch (IllegalArgumentException ex) {
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found", ErrorCode.AUTH_USER_NOT_FOUND));
        }
    }
}
