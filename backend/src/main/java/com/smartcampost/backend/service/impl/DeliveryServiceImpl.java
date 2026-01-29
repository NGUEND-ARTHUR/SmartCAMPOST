package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.delivery.StartDeliveryRequest;
import com.smartcampost.backend.dto.delivery.StartDeliveryResponse;
import com.smartcampost.backend.dto.delivery.CompleteDeliveryRequest;
import com.smartcampost.backend.dto.delivery.CompleteDeliveryResponse;
import com.smartcampost.backend.dto.delivery.DeliveryStatusResponse;
import com.smartcampost.backend.dto.delivery.RescheduleDeliveryRequest;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Courier;
import com.smartcampost.backend.model.Address;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.DeliveryProof;
import com.smartcampost.backend.model.PricingDetail;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.DeliveryAttempt;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.model.enums.PaymentMethod;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.model.enums.DeliveryAttemptResult;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.model.enums.DeliveryProofType;
import com.smartcampost.backend.model.enums.PaymentOption;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.DeliveryProofRepository;
import com.smartcampost.backend.repository.PricingDetailRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.repository.DeliveryAttemptRepository;
import com.smartcampost.backend.service.DeliveryOtpService;
import com.smartcampost.backend.service.DeliveryService;
import com.smartcampost.backend.service.DeliveryProofService;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.DeliveryReceiptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Objects;
// import org.springframework.lang.Nullable; // unused

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
    private final DeliveryAttemptRepository deliveryAttemptRepository;

    private final DeliveryOtpService deliveryOtpService;
    private final DeliveryProofService deliveryProofService;
    private final NotificationService notificationService;
    private final DeliveryReceiptService deliveryReceiptService;

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
        UUID courierId = request.getCourierId();
        if (courierId != null) {
            courier = courierRepository.findById(courierId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Courier not found", ErrorCode.COURIER_NOT_FOUND));
        }

        // Update parcel status to OUT_FOR_DELIVERY
        parcel.setStatus(ParcelStatus.OUT_FOR_DELIVERY);
        Parcel savedParcel = parcelRepository.save(parcel);
        parcel = Objects.requireNonNull(savedParcel, "failed to save parcel");

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
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Use client phone since Address doesn't have phone
        Client client = parcel.getClient();
        if (client == null || client.getPhone() == null) {
            throw new AuthException(ErrorCode.VALIDATION_ERROR,
                    "Recipient phone number not available");
        }

        deliveryOtpService.sendDeliveryOtp(id, client.getPhone());
    }

    // ==================== COMPLETE DELIVERY ====================

    @Override
    @Transactional
    public CompleteDeliveryResponse completeDelivery(CompleteDeliveryRequest request) {
        // Get parcel
        UUID id = request.getParcelId();
        Parcel parcel = getParcel(id, request.getTrackingRef());

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
        Parcel savedParcel = parcelRepository.save(parcel);
        parcel = Objects.requireNonNull(savedParcel, "failed to save parcel");

        // Record scan event
        recordScanEvent(parcel, ScanEventType.DELIVERED, request.getNotes());

        // Notify client
        notificationService.notifyParcelDelivered(parcel);

        // Get courier info
        Courier courier = null;
        if (proof.getCourier() != null) {
            courier = proof.getCourier();
        }

        // Generate delivery receipt
        boolean receiptGenerated = false;
        try {
            deliveryReceiptService.generateReceipt(
                    parcel,
                    proof,
                    request.getReceiverName(),
                    request.isPaymentCollected(),
                    request.getAmountCollected(),
                    request.getPaymentMethod()
            );
            receiptGenerated = true;
            log.info("Receipt generated for parcel {}", parcel.getTrackingRef());
        } catch (Exception e) {
            log.warn("Failed to generate receipt for parcel {}: {}", parcel.getTrackingRef(), e.getMessage());
        }

        // Record successful delivery attempt
        recordDeliveryAttempt(parcel, courier, DeliveryAttemptResult.SUCCESS, null,
                request.getLatitude(), request.getLongitude(), request.getNotes());

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
                .receiptGenerated(receiptGenerated)
                .deliveredAt(now)
                .build();
    }

    // ==================== GET DELIVERY STATUS ====================

    @Override
    public DeliveryStatusResponse getDeliveryStatus(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        Address recipient = parcel.getRecipientAddress();
        Agency destAgency = parcel.getDestinationAgency();

        // Get delivery proof if exists
        Optional<DeliveryProof> proofOpt = deliveryProofRepository.findByParcel(parcel);

        // Get pricing for payment info - use correct method
        Optional<PricingDetail> pricingOpt = pricingDetailRepository.findTopByParcel_IdOrderByAppliedAtDesc(id);
        List<Payment> payments = paymentRepository.findByParcel_IdOrderByTimestampDesc(id);

        double amountDue = pricingOpt.map(PricingDetail::getAppliedPrice).orElse(0.0);
        double amountPaid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount)
                .sum();

        boolean paymentRequired = parcel.getPaymentOption() == PaymentOption.COD;
        boolean paymentCollected = paymentRequired && amountPaid >= amountDue;

        // Determine current stage
        String currentStage = determineDeliveryStage(parcel);

        // Get delivery attempts
        List<DeliveryAttempt> attemptEntities = deliveryAttemptRepository.findByParcel_IdOrderByAttemptNumberAsc(id);
        int attemptCount = attemptEntities.size();
        List<DeliveryStatusResponse.DeliveryAttempt> attempts = attemptEntities.stream()
                .map(a -> DeliveryStatusResponse.DeliveryAttempt.builder()
                        .attemptNumber(a.getAttemptNumber())
                        .attemptedAt(a.getAttemptedAt())
                        .result(a.getResult().name())
                        .failureReason(a.getFailureReason())
                        .latitude(a.getLatitude() != null ? a.getLatitude().doubleValue() : null)
                        .longitude(a.getLongitude() != null ? a.getLongitude().doubleValue() : null)
                        .build())
                .toList();

        return DeliveryStatusResponse.builder()
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .status(parcel.getStatus().name())
                .deliveryOption(parcel.getDeliveryOption().name())
                .currentStage(currentStage)
                .currentAgencyName(destAgency != null ? destAgency.getAgencyName() : null)
                .recipientName(recipient != null ? recipient.getLabel() : null)
                .recipientCity(recipient != null ? recipient.getCity() : null)
                .attemptCount(attemptCount)
                .attempts(attempts)
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
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Record the failed delivery attempt
        int attemptNumber = recordDeliveryAttempt(parcel, null, 
                DeliveryAttemptResult.FAILED_OTHER, reason, null, null, null);

        // Record scan event
        recordScanEvent(parcel, ScanEventType.ARRIVED_DESTINATION,
                "Delivery attempt #" + attemptNumber + " failed: " + reason);

        // Parcel stays at OUT_FOR_DELIVERY or goes back to ARRIVED_HUB
        if (parcel.getStatus() == ParcelStatus.OUT_FOR_DELIVERY) {
            parcel.setStatus(ParcelStatus.ARRIVED_HUB);
            Parcel saved = parcelRepository.save(parcel);
            parcel = Objects.requireNonNull(saved, "failed to save parcel");
        }

        // Notify recipient about failed delivery attempt
        try {
            notificationService.notifyDeliveryAttemptFailed(parcel, attemptNumber, reason);
        } catch (Exception e) {
            log.warn("Failed to send delivery failure notification: {}", e.getMessage());
        }

        log.info("Delivery marked as failed for parcel {}: {}", id, reason);

        return getDeliveryStatus(id);
    }

    // ==================== RESCHEDULE DELIVERY ====================

    @Override
    @Transactional
    public DeliveryStatusResponse rescheduleDelivery(UUID parcelId, RescheduleDeliveryRequest request) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Update expected delivery date
        if (request.getNewDate() != null) {
                parcel.setExpectedDeliveryAt(
                    request.getNewDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
                Parcel saved = parcelRepository.save(parcel);
                if (saved == null) throw new IllegalStateException("failed to save parcel");
        }

        log.info("Delivery rescheduled for parcel {} to {}",
            id, request.getNewDate());

        // Notify recipient about rescheduled delivery
        try {
            notificationService.notifyDeliveryRescheduled(parcel, request.getNewDate(), request.getReason());
        } catch (Exception e) {
            log.warn("Failed to send reschedule notification: {}", e.getMessage());
        }

        return getDeliveryStatus(id);
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
            ScanEvent saved = scanEventRepository.save(event);
            event = Objects.requireNonNull(saved, "failed to save scan event");
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

    /**
     * Record a delivery attempt for tracking purposes.
     * 
     * @return The attempt number
     */
    private int recordDeliveryAttempt(Parcel parcel, Courier courier, DeliveryAttemptResult result,
                                       String failureReason, Double latitude, Double longitude, String notes) {
        int attemptNumber = deliveryAttemptRepository.countByParcel_Id(parcel.getId()) + 1;

        DeliveryAttempt attempt = DeliveryAttempt.builder()
                .parcel(parcel)
                .courier(courier)
                .attemptNumber(attemptNumber)
                .result(result)
                .failureReason(failureReason)
                .latitude(latitude != null ? java.math.BigDecimal.valueOf(latitude) : null)
                .longitude(longitude != null ? java.math.BigDecimal.valueOf(longitude) : null)
                .notes(notes)
                .attemptedAt(Instant.now())
                .build();
        DeliveryAttempt savedAttempt = deliveryAttemptRepository.save(attempt);
        attempt = Objects.requireNonNull(savedAttempt, "failed to save delivery attempt");
        log.info("Recorded delivery attempt #{} for parcel {} - result: {}", 
                attemptNumber, parcel.getTrackingRef(), result);

        return attemptNumber;
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
