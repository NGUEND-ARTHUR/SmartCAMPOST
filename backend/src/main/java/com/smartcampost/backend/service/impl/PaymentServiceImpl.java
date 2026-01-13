package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.payment.ConfirmPaymentRequest;
import com.smartcampost.backend.dto.payment.InitPaymentRequest;
import com.smartcampost.backend.dto.payment.PaymentResponse;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.PricingDetail;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.repository.PricingDetailRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.PaymentGatewayService;
import com.smartcampost.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final ParcelRepository parcelRepository;
    private final UserAccountRepository userAccountRepository;
    private final PricingDetailRepository pricingDetailRepository;
    private final PaymentGatewayService paymentGatewayService;

    // ======================================================
    // INIT PAYMENT  (US35)
    // ======================================================
    @Override
    public PaymentResponse initPayment(InitPaymentRequest request) {

        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(
                    ErrorCode.AUTH_FORBIDDEN,
                    "Current user is not a client"
            );
        }

        // --- Récupérer le colis ---
        Parcel parcel = parcelRepository.findById(request.getParcelId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND
                ));

        // Le colis doit appartenir au client
        if (!parcel.getClient().getId().equals(user.getEntityId())) {
            throw new AuthException(
                    ErrorCode.AUTH_FORBIDDEN,
                    "You do not own this parcel"
            );
        }

        // --- Vérifier si déjà payé ---
        if (paymentRepository.existsByParcel_IdAndStatus(parcel.getId(), PaymentStatus.SUCCESS)) {
            throw new ConflictException(
                    "Parcel already fully paid",
                    ErrorCode.PAYMENT_ALREADY_PROCESSED
            );
        }

        // --- Récupérer le dernier prix appliqué ---
        PricingDetail pricing = pricingDetailRepository
                .findTopByParcel_IdOrderByAppliedAtDesc(parcel.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No pricing found for parcel",
                        ErrorCode.PRICING_NOT_FOUND
                ));

        Double amount = pricing.getAppliedPrice();
        String currency = request.getCurrency() != null ? request.getCurrency() : "XAF";

        // --- Appel (mock) au gateway ---
        String payerPhone = request.getPayerPhone() != null
                ? request.getPayerPhone()
                : parcel.getClient().getPhone();

        String externalRef = paymentGatewayService.initiatePayment(
                payerPhone,
                amount,
                currency,
                "Payment for parcel " + parcel.getTrackingRef()
        );

        // --- Créer paiement (PENDING) ---
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .amount(amount)
                .currency(currency)
                .method(request.getMethod())
                .status(PaymentStatus.PENDING)
                .timestamp(Instant.now())
                .externalRef(externalRef)
                .build();

        paymentRepository.save(payment);

        return toResponse(payment);
    }

    // ======================================================
    // CONFIRM PAYMENT  (US36)
    // ======================================================
    @Override
    public PaymentResponse confirmPayment(ConfirmPaymentRequest request) {

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found", ErrorCode.PAYMENT_NOT_FOUND
                ));

        // Déjà finalisé ?
        if (payment.getStatus() == PaymentStatus.SUCCESS
                || payment.getStatus() == PaymentStatus.FAILED
                || payment.getStatus() == PaymentStatus.CANCELLED) {

            throw new ConflictException(
                    "Payment already processed",
                    ErrorCode.PAYMENT_ALREADY_PROCESSED
            );
        }

        boolean success = Boolean.TRUE.equals(request.getSuccess());

        if (success) {

            // Vérification gateway (mock)
            boolean gatewayOk = paymentGatewayService.verifyPayment(payment.getExternalRef());
            if (!gatewayOk) {
                throw new ConflictException(
                        "Gateway verification failed",
                        ErrorCode.PAYMENT_GATEWAY_ERROR
                );
            }

            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTimestamp(Instant.now());

        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setTimestamp(Instant.now());
        }

        // Mise à jour éventuelle de la référence externe
        if (request.getGatewayRef() != null && !request.getGatewayRef().isBlank()) {
            payment.setExternalRef(request.getGatewayRef());
        }

        paymentRepository.save(payment);

        return toResponse(payment);
    }

    // ======================================================
    // GET PAYMENT BY ID
    // ======================================================
    @Override
    public PaymentResponse getPaymentById(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found", ErrorCode.PAYMENT_NOT_FOUND
                ));

        enforceAccess(payment);

        return toResponse(payment);
    }

    // ======================================================
    // LIST PAYMENTS FOR PARCEL (CLIENT / STAFF)
    // ======================================================
    @Override
    public List<PaymentResponse> getPaymentsForParcel(UUID parcelId) {

        List<Payment> payments = paymentRepository
                .findByParcel_IdOrderByTimestampDesc(parcelId);

        if (!payments.isEmpty()) {
            enforceAccess(payments.get(0));
        } else {
            // Aucun paiement, mais on doit quand même contrôler l'accès au parcel
            Parcel parcel = parcelRepository.findById(parcelId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parcel not found", ErrorCode.PARCEL_NOT_FOUND
                    ));
            enforceParcelAccess(parcel);
        }

        return payments.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ======================================================
    // LIST ALL PAYMENTS (ADMIN / STAFF)
    // ======================================================
    @Override
    public Page<PaymentResponse> listAllPayments(int page, int size) {

        UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(
                    ErrorCode.AUTH_FORBIDDEN,
                    "Not allowed to list all payments"
            );
        }

        return paymentRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ======================================================
    // 🔥 SPRINT 14 — COD SUPPORT
    // ======================================================

    @Override
    public PaymentResponse createCodPendingPayment(UUID parcelId) {

        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND
                ));

        // si déjà un paiement SUCCESS pour ce colis → on ne recrée pas
        if (paymentRepository.existsByParcel_IdAndStatus(parcel.getId(), PaymentStatus.SUCCESS)) {
            throw new ConflictException(
                    "Parcel already fully paid",
                    ErrorCode.PAYMENT_ALREADY_PROCESSED
            );
        }

        PricingDetail pricing = pricingDetailRepository
                .findTopByParcel_IdOrderByAppliedAtDesc(parcel.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No pricing found for parcel",
                        ErrorCode.PRICING_NOT_FOUND
                ));

        Double amount = pricing.getAppliedPrice();
        String currency = "XAF"; // par défaut

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .amount(amount)
                .currency(currency)
                // plus tard: PaymentMethod.COD
                .method(null)
                .status(PaymentStatus.PENDING)
                .timestamp(Instant.now())
                .externalRef(null)
                .build();

        paymentRepository.save(payment);

        return toResponse(payment);
    }

    @Override
    public PaymentResponse markCodAsPaid(UUID parcelId) {

        List<Payment> payments = paymentRepository
                .findByParcel_IdOrderByTimestampDesc(parcelId);

        Payment target;

        if (payments.isEmpty()) {
            // Aucun paiement pour ce colis → on crée d’abord un COD PENDING
            PaymentResponse pending = createCodPendingPayment(parcelId);
            target = paymentRepository.findById(pending.getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Payment not found", ErrorCode.PAYMENT_NOT_FOUND
                    ));
        } else {
            // On prend le plus récent
            target = payments.get(0);
        }

        // Si déjà SUCCESS, on renvoie simplement
        if (target.getStatus() == PaymentStatus.SUCCESS) {
            return toResponse(target);
        }

        target.setStatus(PaymentStatus.SUCCESS);
        target.setTimestamp(Instant.now());

        paymentRepository.save(target);

        return toResponse(target);
    }

    // ======================================================
    // 🔥 SPRINT 14 — Additional delivery charge
    // ======================================================
    @Override
    public PaymentResponse handleAdditionalDeliveryCharge(UUID parcelId, BigDecimal additionalAmount) {

        if (additionalAmount == null || additionalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ConflictException(
                    "Additional amount must be > 0",
                    ErrorCode.PAYMENT_INVALID_AMOUNT
            );
        }

        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND
                ));

        // On crée un paiement dédié pour le supplément de livraison
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .amount(additionalAmount.doubleValue())
                .currency("XAF")
                // plus tard: PaymentMethod.CASH, etc.
                .method(null)
                // on considère que ce supplément est payé immédiatement au comptoir
                .status(PaymentStatus.SUCCESS)
                .timestamp(Instant.now())
                .externalRef(null)
                .build();

        paymentRepository.save(payment);

        return toResponse(payment);
    }

    // ======================================================
    // ACCESS CONTROL
    // ======================================================
    private void enforceAccess(Payment payment) {
        Parcel parcel = payment.getParcel();
        enforceParcelAccess(parcel);
    }

    private void enforceParcelAccess(Parcel parcel) {
        UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT) {
            if (!parcel.getClient().getId().equals(user.getEntityId())) {
                throw new AuthException(
                        ErrorCode.AUTH_FORBIDDEN,
                        "You cannot access this payment"
                );
            }
        }

        if (user.getRole() == UserRole.COURIER) {
            throw new AuthException(
                    ErrorCode.AUTH_FORBIDDEN,
                    "Courier cannot access payment details"
            );
        }
        // STAFF / AGENT / ADMIN : ok
    }

    // ======================================================
    // CURRENT USER
    // ======================================================
    private UserAccount getCurrentUserAccount() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(
                    ErrorCode.AUTH_UNAUTHORIZED,
                    "Unauthenticated"
            );
        }

        String subject = auth.getName();

        try {
            UUID id = UUID.fromString(subject);
            return userAccountRepository.findById(id)
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

    // ======================================================
    // MAPPER
    // ======================================================
    private PaymentResponse toResponse(Payment payment) {

        Parcel parcel = payment.getParcel();

        return PaymentResponse.builder()
                .id(payment.getId())
                .parcelId(parcel.getId())
                .parcelTrackingRef(parcel.getTrackingRef())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .method(payment.getMethod())
                .status(payment.getStatus())
                .timestamp(payment.getTimestamp())
                .externalRef(payment.getExternalRef())
                .build();
    }

    // ======================================================
    // 🔥 SPRINT 16 — PAYMENT AT DIFFERENT STAGES
    // ======================================================

    @Override
    public PaymentResponse createRegistrationPayment(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Get pricing
        PricingDetail pricing = pricingDetailRepository
                .findTopByParcel_IdOrderByAppliedAtDesc(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No pricing found for parcel", ErrorCode.PRICING_NOT_FOUND));

        // Create pending payment for registration
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .amount(pricing.getAppliedPrice())
                .currency("XAF")
                .method(com.smartcampost.backend.model.enums.PaymentMethod.MOBILE_MONEY)
                .status(PaymentStatus.PENDING)
                .timestamp(Instant.now())
                .build();

        paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Override
    public PaymentResponse processPickupPayment(UUID parcelId, String paymentMethod, Double amount) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        com.smartcampost.backend.model.enums.PaymentMethod method;
        try {
            method = com.smartcampost.backend.model.enums.PaymentMethod.valueOf(paymentMethod);
        } catch (IllegalArgumentException e) {
            method = com.smartcampost.backend.model.enums.PaymentMethod.CASH;
        }

        // Create successful payment for pickup
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .amount(amount)
                .currency("XAF")
                .method(method)
                .status(PaymentStatus.SUCCESS)
                .timestamp(Instant.now())
                .externalRef("PICKUP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Override
    public PaymentResponse processDeliveryPayment(UUID parcelId, String paymentMethod, Double amount) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        com.smartcampost.backend.model.enums.PaymentMethod method;
        try {
            method = com.smartcampost.backend.model.enums.PaymentMethod.valueOf(paymentMethod);
        } catch (IllegalArgumentException e) {
            method = com.smartcampost.backend.model.enums.PaymentMethod.CASH;
        }

        // Create successful payment for delivery (COD)
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .amount(amount)
                .currency("XAF")
                .method(method)
                .status(PaymentStatus.SUCCESS)
                .timestamp(Instant.now())
                .externalRef("COD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Override
    public PaymentSummary getPaymentSummary(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Get all payments - use correct method
        List<Payment> payments = paymentRepository.findByParcel_IdOrderByTimestampDesc(parcelId);

        // Get pricing for total due
        Double totalDue = pricingDetailRepository
                .findTopByParcel_IdOrderByAppliedAtDesc(parcelId)
                .map(PricingDetail::getAppliedPrice)
                .orElse(0.0);

        // Calculate total paid
        Double totalPaid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount)
                .sum();

        Double balance = totalDue - totalPaid;

        String paymentStatus;
        if (totalPaid >= totalDue) {
            paymentStatus = "PAID";
        } else if (totalPaid > 0) {
            paymentStatus = "PARTIAL";
        } else {
            paymentStatus = "PENDING";
        }

        List<PaymentResponse> paymentResponses = payments.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new PaymentSummary(
                parcelId,
                parcel.getTrackingRef(),
                totalDue,
                totalPaid,
                balance,
                parcel.getPaymentOption().name(),
                paymentStatus,
                paymentResponses
        );
    }
}
