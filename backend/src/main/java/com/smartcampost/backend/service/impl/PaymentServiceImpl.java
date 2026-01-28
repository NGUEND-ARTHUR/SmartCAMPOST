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
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.ErrorCode;

@Service
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository paymentRepository;
    private final ParcelRepository parcelRepository;
    private final InvoiceService invoiceService;

    public PaymentServiceImpl(PaymentRepository paymentRepository, ParcelRepository parcelRepository, InvoiceService invoiceService) {
        this.paymentRepository = paymentRepository;
        this.parcelRepository = parcelRepository;
        this.invoiceService = invoiceService;
    }

    @Override
    public PaymentResponse initPayment(InitPaymentRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(request.getParcelId(), "parcelId is required");

        Parcel parcel = parcelRepository.findById(request.getParcelId())
            .orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(0.0)
                .currency(request.getCurrency() != null ? request.getCurrency() : "XAF")
                .method(request.getMethod())
                .status(PaymentStatus.PENDING)
                .externalRef(request.getPayerPhone())
                .build();

        paymentRepository.save(p);
        return toDto(p);
    }

    @Override
    public PaymentResponse confirmPayment(ConfirmPaymentRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(request.getPaymentId(), "paymentId is required");

        Payment p = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found", ErrorCode.PAYMENT_NOT_FOUND));

        p.setStatus(request.getSuccess() ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
        if (request.getGatewayRef() != null) p.setExternalRef(request.getGatewayRef());
        paymentRepository.save(p);

        if (request.getSuccess()) {
            // Issue invoice synchronously
            invoiceService.issueInvoiceForPayment(p.getId());
        }
        return toDto(p);
    }

    @Override
    public PaymentResponse getPaymentById(UUID paymentId) {
        Objects.requireNonNull(paymentId, "paymentId is required");
        return paymentRepository.findById(paymentId)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found", ErrorCode.PAYMENT_NOT_FOUND));
    }

    @Override
    public List<PaymentResponse> getPaymentsForParcel(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        return paymentRepository.findByParcel_IdOrderByTimestampDesc(parcelId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public Page<PaymentResponse> listAllPayments(int page, int size) {
        var pg = paymentRepository.findAll(org.springframework.data.domain.PageRequest.of(page, size));
        return pg.map(this::toDto);
    }

    @Override
    public PaymentResponse markCodAsPaid(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        var payments = paymentRepository.findByParcel_IdOrderByTimestampDesc(parcelId);
        var opt = payments.stream().filter(pp -> pp.getStatus() == PaymentStatus.PENDING).findFirst();
        if (opt.isEmpty()) throw new ResourceNotFoundException("COD payment not found", ErrorCode.PAYMENT_NOT_FOUND);
        Payment p = Objects.requireNonNull(opt.get(), "payment must not be null");
        p.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(p);
        invoiceService.issueInvoiceForPayment(p.getId());
        return toDto(p);
    }

    @Override
    public PaymentResponse createCodPendingPayment(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId).orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(0.0)
                .currency("XAF")
                .method(PaymentMethod.CASH)
                .status(PaymentStatus.PENDING)
                .build();
        paymentRepository.save(p);
        return toDto(p);
    }

    @Override
    public PaymentResponse handleAdditionalDeliveryCharge(UUID parcelId, BigDecimal additionalAmount) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(additionalAmount, "additionalAmount is required");
        Parcel parcel = parcelRepository.findById(parcelId).orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(additionalAmount.doubleValue())
                .currency("XAF")
                .method(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING)
                .build();
        paymentRepository.save(p);
        return toDto(p);
    }

    @Override
    public PaymentResponse createRegistrationPayment(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId).orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(0.0)
                .currency("XAF")
                .method(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING)
                .build();
        paymentRepository.save(p);
        return toDto(p);
    }

    @Override
    public PaymentResponse processPickupPayment(UUID parcelId, String paymentMethod, Double amount) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Objects.requireNonNull(amount, "amount is required");
        Parcel parcel = parcelRepository.findById(parcelId).orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        Payment p = Payment.builder()
                .parcel(parcel)
                .amount(amount)
                .currency("XAF")
                .method(paymentMethod != null ? PaymentMethod.valueOf(paymentMethod) : PaymentMethod.CASH)
                .status(PaymentStatus.SUCCESS)
                .build();
        paymentRepository.save(p);
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
        List<PaymentResponse> payments = getPaymentsForParcel(parcelId);
        double totalPaid = payments.stream().filter(p -> p.getStatus() == PaymentStatus.SUCCESS).mapToDouble(PaymentResponse::getAmount).sum();
        double totalDue = 0.0; // requires pricing; leave 0.0
        double balance = totalDue - totalPaid;
        String status = totalPaid >= totalDue ? "PAID" : (totalPaid > 0 ? "PARTIAL" : "PENDING");
        String paymentOption = "UNKNOWN";
        return new PaymentSummary(parcelId, "", totalDue, totalPaid, balance, paymentOption, status, payments);
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
                .build();
    }
}
