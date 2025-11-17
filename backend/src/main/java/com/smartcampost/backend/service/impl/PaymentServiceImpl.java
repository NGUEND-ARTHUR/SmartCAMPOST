package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.payment.PaymentInitRequest;
import com.smartcampost.backend.dto.payment.PaymentResponse;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.enums.CurrencyCode;
import com.smartcampost.backend.model.enums.PaymentMethod;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final ParcelRepository parcelRepository;

    @Override
    public PaymentResponse initiatePayment(PaymentInitRequest request) {
        Parcel parcel = parcelRepository.findById(request.getParcelId())
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + request.getParcelId()));

        // DTO -> Entity
        Double amount = request.getAmount().doubleValue();          // BigDecimal -> Double
        CurrencyCode currencyEnum = request.getCurrency();          // enum
        PaymentMethod methodEnum = request.getMethod();             // enum

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .amount(amount)
                .currency(currencyEnum.name())    // String en base
                .method(methodEnum)
                .status(PaymentStatus.INIT)
                .build();

        payment = paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Override
    public PaymentResponse completePayment(UUID paymentId, boolean success, String externalRef) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        payment.setStatus(success ? PaymentStatus.PAID : PaymentStatus.FAILED);
        payment.setExternalRef(externalRef);

        payment = paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Override
    public List<PaymentResponse> listPaymentsForParcel(UUID parcelId) {
        return paymentRepository.findByParcel_Id(parcelId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private PaymentResponse toResponse(Payment payment) {
        BigDecimal amount = payment.getAmount() != null
                ? BigDecimal.valueOf(payment.getAmount())
                : null;

        CurrencyCode currencyEnum = null;
        if (payment.getCurrency() != null) {
            currencyEnum = CurrencyCode.valueOf(payment.getCurrency());
        }

        return PaymentResponse.builder()
                .id(payment.getId())
                .parcelId(payment.getParcel().getId())
                .amount(amount)
                .currency(currencyEnum)
                .method(payment.getMethod())
                .status(payment.getStatus())
                .timestamp(payment.getTimestamp())
                .externalRef(payment.getExternalRef())
                .build();
    }
}
