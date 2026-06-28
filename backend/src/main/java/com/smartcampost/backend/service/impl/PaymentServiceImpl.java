package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.payment.ConfirmPaymentRequest;
import com.smartcampost.backend.dto.payment.InitPaymentRequest;
import com.smartcampost.backend.dto.payment.PaymentResponse;
import com.smartcampost.backend.service.PaymentService;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.model.enums.PaymentMethod;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.InvoiceService;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.PaymentGatewayService;
import com.smartcampost.backend.service.PricingService;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository paymentRepository;
    private final ParcelRepository parcelRepository;
    private final com.smartcampost.backend.repository.UserAccountRepository userAccountRepository;
    private final InvoiceService invoiceService;
    private final PricingService pricingService;
    private final NotificationService notificationService;
    private final PaymentGatewayService paymentGatewayService;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            ParcelRepository parcelRepository,
            com.smartcampost.backend.repository.UserAccountRepository userAccountRepository,
            InvoiceService invoiceService,
            PricingService pricingService,
            NotificationService notificationService,
            PaymentGatewayService paymentGatewayService
    ) {
        this.paymentRepository = paymentRepository;
        this.parcelRepository = parcelRepository;
        this.userAccountRepository = userAccountRepository;
        this.invoiceService = invoiceService;
        this.pricingService = pricingService;
        this.notificationService = notificationService;
        this.paymentGatewayService = paymentGatewayService;
    }

    @Override
    public PaymentResponse initPayment(InitPaymentRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(request.getParcelId(), "parcelId is required");
        UUID parcelId = Objects.requireNonNull(request.getParcelId(), "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Only block if already paid successfully
        if (paymentRepository.existsByParcel_IdAndStatus(parcelId, PaymentStatus.SUCCESS)) {
            throw new ConflictException("This parcel has already been paid", ErrorCode.PAYMENT_ALREADY_PROCESSED);
        }
        // Cancel old PENDING payments so user can retry
        paymentRepository.findByParcel_IdOrderByTimestampDesc(parcelId).stream()
                .filter(pay -> pay.getStatus() == PaymentStatus.PENDING)
                .forEach(pay -> { pay.setStatus(PaymentStatus.FAILED); paymentRepository.save(pay); });

        // Server-side pricing: do not accept client-provided amounts
        var quote = pricingService.quotePrice(parcelId);
        if (quote == null || quote.doubleValue() <= 0) {
            throw new IllegalStateException("Pricing unavailable for parcel " + parcelId);
        }
        double amount = quote.doubleValue();

        String currency = request.getCurrency() != null ? request.getCurrency() : "XAF";
        String gatewayRef = null;
        PaymentStatus status = PaymentStatus.PENDING;

        if (request.getMethod() == PaymentMethod.MOBILE_MONEY) {
            String payerPhone = request.getPayerPhone();
            if (payerPhone == null || payerPhone.isBlank()) {
                throw new IllegalArgumentException("payerPhone is required for MOBILE_MONEY");
            }
            try {
                gatewayRef = paymentGatewayService.initiatePayment(
                        payerPhone, amount, currency,
                        "PARCEL:" + parcel.getTrackingRef()
                );
            } catch (Exception e) {
                log.error("Payment gateway failed for parcel {}: {}", parcel.getTrackingRef(), e.getMessage());
                status = PaymentStatus.FAILED;
            }
        }

        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(amount)
                .currency(currency)
                .method(request.getMethod())
                .status(status)
                .externalRef(gatewayRef)
                .build();

        Payment saved = paymentRepository.save(p);
        return toDto(saved);
    }

    @Override
    public PaymentResponse confirmPayment(ConfirmPaymentRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(request.getPaymentId(), "paymentId is required");
        UUID paymentId = Objects.requireNonNull(request.getPaymentId(), "paymentId is required");
        Payment p = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found", ErrorCode.PAYMENT_NOT_FOUND));

        if (request.getGatewayRef() != null) p.setExternalRef(request.getGatewayRef());

        // A gateway-backed payment must be re-verified against the provider — the caller's
        // `success` flag is never trusted on its own, otherwise any ADMIN/FINANCE/STAFF call
        // could fabricate a SUCCESS status for a payment that never actually went through.
        boolean success;
        if (p.getExternalRef() != null && !p.getExternalRef().isBlank()) {
            success = paymentGatewayService.verifyPayment(p.getExternalRef());
            log.info("Payment {} re-verified with gateway before confirm: success={}", paymentId, success);
        } else {
            // No gateway reference to verify against (e.g. manual/cash entry) — honor the explicit flag.
            success = Boolean.TRUE.equals(request.getSuccess());
        }

        p.setStatus(success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
        Payment saved = paymentRepository.save(p);
        p = saved;

        if (success) {
            try {
                notificationService.notifyPaymentConfirmed(p.getParcel(), p.getAmount(), p.getCurrency());
            } catch (Exception ex) {
                log.warn("Notification failed during payment confirmation", ex);
            }
            // Issue invoice synchronously
            invoiceService.issueInvoiceForPayment(p.getId());
        }
        return toDto(p);
    }

    @Override
    public PaymentResponse getPaymentById(UUID paymentId) {
        UUID id = Objects.requireNonNull(paymentId, "paymentId is required");
        PaymentResponse resp = paymentRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found", ErrorCode.PAYMENT_NOT_FOUND));
        return resp;
    }

    @Override
    public List<PaymentResponse> getPaymentsForParcel(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        return paymentRepository.findByParcel_IdOrderByTimestampDesc(id).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public Page<PaymentResponse> listAllPayments(int page, int size) {
        var pg = paymentRepository.findAll(org.springframework.data.domain.PageRequest.of(page, size));
        return pg.map(this::toDto);
    }

    @Override
    public Page<PaymentResponse> listMyPayments(int page, int size) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_UNAUTHORIZED, "Not authenticated");
        }
        // Get all parcels visible to the current user, then their payments
        var myParcels = parcelRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 10000));
        UUID entityId = null;
        try {
            var userAccount = userAccountRepository.findById(UUID.fromString(auth.getName()));
            if (userAccount.isPresent()) {
                entityId = userAccount.get().getEntityId();
            }
        } catch (Exception ignored) {}

        final UUID clientId = entityId;
        var myPayments = myParcels.stream()
                .filter(p -> p.getClient() != null && clientId != null && clientId.equals(p.getClient().getId()))
                .flatMap(p -> paymentRepository.findByParcel_IdOrderByTimestampDesc(p.getId()).stream())
                .map(this::toDto)
                .toList();
        return new org.springframework.data.domain.PageImpl<>(myPayments, org.springframework.data.domain.PageRequest.of(page, size), myPayments.size());
    }

    @Override
    public PaymentResponse markCodAsPaid(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        var payments = paymentRepository.findByParcel_IdOrderByTimestampDesc(id);
        var opt = payments.stream().filter(pp -> pp.getStatus() == PaymentStatus.PENDING).findFirst();
        if (opt.isEmpty()) throw new ResourceNotFoundException("COD payment not found", ErrorCode.PAYMENT_NOT_FOUND);
        Payment p = opt.orElseThrow(() -> new ResourceNotFoundException("COD payment not found", ErrorCode.PAYMENT_NOT_FOUND));
        p.setStatus(PaymentStatus.SUCCESS);
        Payment saved2 = paymentRepository.save(p);
        p = saved2;
        try {
            notificationService.notifyPaymentConfirmed(p.getParcel(), p.getAmount(), p.getCurrency());
        } catch (Exception ex) {
            log.warn("Notification failed during COD settlement", ex);
        }
        invoiceService.issueInvoiceForPayment(p.getId());
        return toDto(p);
    }

    @Override
    public PaymentResponse createCodPendingPayment(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        double amount = 0.0;
        try {
            var quote = pricingService.quotePrice(id);
            if (quote != null) amount = quote.doubleValue();
        } catch (Exception ex) {
            log.error("Pricing failed for COD parcel {}; defaulting amount to 0.0", id, ex);
            amount = 0.0;
        }

        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(amount)
                .currency("XAF")
                .method(PaymentMethod.CASH)
                .status(PaymentStatus.PENDING)
                .build();
        Payment saved3 = paymentRepository.save(p);
        p = saved3;
        return toDto(p);
    }

    @Override
    public PaymentResponse handleAdditionalDeliveryCharge(UUID parcelId, BigDecimal additionalAmount) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(additionalAmount, "additionalAmount is required");
        Parcel parcel = parcelRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(additionalAmount.doubleValue())
                .currency("XAF")
                .method(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING)
                .build();
        Payment saved4 = paymentRepository.save(p);
        p = saved4;
        return toDto(p);
    }

    @Override
    public PaymentResponse createRegistrationPayment(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        double amount = 0.0;
        try {
            var quote = pricingService.quotePrice(id);
            if (quote != null) amount = quote.doubleValue();
        } catch (Exception ex) {
            log.error("Pricing failed for registration parcel {}; defaulting amount to 0.0", id, ex);
            amount = 0.0;
        }

        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(amount)
                .currency("XAF")
                .method(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING)
                .build();
        Payment saved5 = paymentRepository.save(p);
        p = saved5;
        return toDto(p);
    }

    @Override
    public PaymentResponse processPickupPayment(UUID parcelId, String paymentMethod, Double amount) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Auto-compute amount from pricing if not provided (cash confirmation flow)
        double amountDue;
        try {
            var quote = pricingService.quotePrice(id);
            if (quote == null || quote.doubleValue() <= 0) {
                throw new IllegalStateException("Pricing returned zero or null for parcel " + id);
            }
            amountDue = quote.doubleValue();
        } catch (Exception ex) {
            log.error("Pricing failed for parcel {} during payment validation", id, ex);
            throw new IllegalStateException("Cannot process payment: pricing unavailable for parcel " + id, ex);
        }
        if (amount == null) {
            amount = amountDue;
        }
        if (amountDue > 0) {
            double alreadyPaid = paymentRepository.findByParcel_IdOrderByTimestampDesc(id).stream()
                    .filter(pp -> pp.getStatus() == PaymentStatus.SUCCESS)
                    .mapToDouble(Payment::getAmount)
                    .sum();
            double remainingDue = amountDue - alreadyPaid;
            if (remainingDue > 0 && amount < remainingDue - 1.0) {
                throw new AuthException(ErrorCode.VALIDATION_ERROR,
                        "Amount (" + amount + " XAF) is less than the remaining balance due (" + remainingDue + " XAF)");
            }
        }

        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(amount)
                .currency("XAF")
                .method(paymentMethod != null ? PaymentMethod.valueOf(paymentMethod) : PaymentMethod.CASH)
                .status(PaymentStatus.SUCCESS)
                .build();
        Payment saved6 = paymentRepository.save(p);
        p = saved6;
        try {
            notificationService.notifyPaymentConfirmed(p.getParcel(), p.getAmount(), p.getCurrency());
        } catch (Exception ex) {
            log.warn("Notification failed during pickup payment", ex);
        }
        invoiceService.issueInvoiceForPayment(p.getId());
        return toDto(p);
    }

    @Override
    public PaymentResponse processDeliveryPayment(UUID parcelId, String paymentMethod, Double amount) {
        return processPickupPayment(parcelId, paymentMethod, amount);
    }

    @Override
    public PaymentSummary getPaymentSummary(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        List<PaymentResponse> payments = getPaymentsForParcel(parcelId);
        double totalPaid = payments.stream().filter(p -> p.getStatus() == PaymentStatus.SUCCESS).mapToDouble(PaymentResponse::getAmount).sum();
        double totalDue = 0.0;
        try {
            var quote = pricingService.quotePrice(parcelId);
            if (quote != null) totalDue = quote.doubleValue();
        } catch (Exception ex) {
            log.error("Pricing failed for payment summary parcel {}; defaulting totalDue to 0.0", parcelId, ex);
            totalDue = 0.0;
        }
        double balance = totalDue - totalPaid;
        String status = totalPaid >= totalDue ? "PAID" : (totalPaid > 0 ? "PARTIAL" : "PENDING");
        String paymentOption = parcel.getPaymentOption() != null ? parcel.getPaymentOption().name() : "UNKNOWN";
        String trackingRef = parcel.getTrackingRef() != null ? parcel.getTrackingRef() : "";
        return new PaymentSummary(parcelId, trackingRef, totalDue, totalPaid, balance, paymentOption, status, payments);
    }

    @Override
    public void handleFapshiWebhook(String transId, String status, Double amount) {
        Objects.requireNonNull(transId, "transId is required");
        Objects.requireNonNull(status, "status is required");

        Payment payment = paymentRepository.findFirstByExternalRefOrderByTimestampDesc(transId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found for transId: " + transId, ErrorCode.PAYMENT_NOT_FOUND));

        switch (status) {
            case "SUCCESSFUL" -> {
                payment.setStatus(PaymentStatus.SUCCESS);
                paymentRepository.save(payment);
                try {
                    notificationService.notifyPaymentConfirmed(payment.getParcel(), payment.getAmount(), payment.getCurrency());
                } catch (Exception ex) {
                    log.warn("Notification failed during Fapshi webhook", ex);
                }
                invoiceService.issueInvoiceForPayment(payment.getId());
            }
            case "FAILED", "EXPIRED" -> {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }
            default -> log.warn("Unknown Fapshi status '{}' for transId {}", status, transId);
        }
    }

    private PaymentResponse toDto(Payment p) {
        Objects.requireNonNull(p, "payment is required");
        return PaymentResponse.builder()
                .id(p.getId())
                .parcelId(p.getParcel() != null ? p.getParcel().getId() : null)
                .parcelTrackingRef(p.getParcel() != null ? p.getParcel().getTrackingRef() : null)
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .method(p.getMethod())
                .status(p.getStatus())
                .timestamp(p.getTimestamp())
                .externalRef(p.getExternalRef())
                .reversed(p.getReversed())
                .build();
    }
}
