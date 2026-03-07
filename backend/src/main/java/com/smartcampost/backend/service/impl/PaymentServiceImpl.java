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
import com.smartcampost.backend.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@SuppressWarnings("null")
@Transactional
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository paymentRepository;
    private final ParcelRepository parcelRepository;
    private final InvoiceService invoiceService;
    private final PricingService pricingService;
    private final NotificationService notificationService;
    private final PaymentGatewayService paymentGatewayService;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            ParcelRepository parcelRepository,
            InvoiceService invoiceService,
            PricingService pricingService,
            NotificationService notificationService,
            PaymentGatewayService paymentGatewayService
    ) {
        this.paymentRepository = paymentRepository;
        this.parcelRepository = parcelRepository;
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

        // Server-side pricing: do not accept client-provided amounts
        var quote = pricingService.quotePrice(parcelId);
        if (quote == null || quote.doubleValue() <= 0) {
            throw new IllegalStateException("Pricing unavailable for parcel " + parcelId);
        }
        double amount = quote.doubleValue();

        String currency = request.getCurrency() != null ? request.getCurrency() : "XAF";
        String gatewayRef = null;

        if (request.getMethod() == PaymentMethod.MOBILE_MONEY) {
            String payerPhone = request.getPayerPhone();
            if (payerPhone == null || payerPhone.isBlank()) {
                throw new IllegalArgumentException("payerPhone is required for MOBILE_MONEY");
            }
            // Initiate the payment via configured gateway (MTN / ORANGE / MOCK)
            gatewayRef = paymentGatewayService.initiatePayment(
                    payerPhone,
                    amount,
                    currency,
                    "PARCEL:" + parcel.getTrackingRef()
            );
        }

        Payment p = Payment.builder()
                .parcel(parcel)
            .amount(amount)
                .currency(currency)
                .method(request.getMethod())
                .status(PaymentStatus.PENDING)
                .externalRef(gatewayRef)
                .build();

        @SuppressWarnings("null")
        Payment saved = paymentRepository.save(p);
        p = saved;
        return toDto(p);
    }

    @Override
    public PaymentResponse confirmPayment(ConfirmPaymentRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(request.getPaymentId(), "paymentId is required");
        UUID paymentId = Objects.requireNonNull(request.getPaymentId(), "paymentId is required");
        Payment p = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found", ErrorCode.PAYMENT_NOT_FOUND));

        p.setStatus(request.getSuccess() ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
        if (request.getGatewayRef() != null) p.setExternalRef(request.getGatewayRef());
        @SuppressWarnings("null")
        Payment saved = paymentRepository.save(p);
        p = saved;

        if (request.getSuccess()) {
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
    public PaymentResponse markCodAsPaid(UUID parcelId) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        var payments = paymentRepository.findByParcel_IdOrderByTimestampDesc(id);
        var opt = payments.stream().filter(pp -> pp.getStatus() == PaymentStatus.PENDING).findFirst();
        if (opt.isEmpty()) throw new ResourceNotFoundException("COD payment not found", ErrorCode.PAYMENT_NOT_FOUND);
        Payment p = opt.orElseThrow(() -> new ResourceNotFoundException("COD payment not found", ErrorCode.PAYMENT_NOT_FOUND));
        p.setStatus(PaymentStatus.SUCCESS);
        @SuppressWarnings("null")
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
        @SuppressWarnings("null")
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
        @SuppressWarnings("null")
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
        @SuppressWarnings("null")
        Payment saved5 = paymentRepository.save(p);
        p = saved5;
        return toDto(p);
    }

    @Override
    public PaymentResponse processPickupPayment(UUID parcelId, String paymentMethod, Double amount) {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(amount, "amount is required");
        Parcel parcel = parcelRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(amount)
                .currency("XAF")
                .method(paymentMethod != null ? PaymentMethod.valueOf(paymentMethod) : PaymentMethod.CASH)
                .status(PaymentStatus.SUCCESS)
                .build();
        @SuppressWarnings("null")
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
