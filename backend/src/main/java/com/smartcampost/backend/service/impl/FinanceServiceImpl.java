package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.refund.RefundResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.Refund;
import com.smartcampost.backend.model.enums.RefundStatus;
import com.smartcampost.backend.repository.RefundRepository;
import com.smartcampost.backend.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinanceServiceImpl implements FinanceService {

    private final RefundRepository refundRepository;

    @Override
    public Page<RefundResponse> listRefunds(int page, int size) {
        return refundRepository.findAll(PageRequest.of(page, size)).map(this::toResponse);
    }

    @Override
    public RefundResponse updateRefundStatus(UUID refundId, RefundStatus status) {
        UUID id = Objects.requireNonNull(refundId, "refundId is required");
        Refund refund = refundRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found", ErrorCode.REFUND_NOT_FOUND));

        refund.setStatus(status);
        if (status == RefundStatus.PROCESSED && refund.getProcessedAt() == null) {
            refund.setProcessedAt(Instant.now());
        }

        Refund saved = Objects.requireNonNull(refundRepository.save(refund), "failed to save refund");
        return toResponse(saved);
    }

    private RefundResponse toResponse(Refund refund) {
        Payment payment = refund.getPayment();
        Parcel parcel = payment.getParcel();

        return RefundResponse.builder()
                .id(refund.getId())
                .paymentId(payment.getId())
                .parcelId(parcel.getId())
                .parcelTrackingRef(parcel.getTrackingRef())
                .amount(refund.getAmount())
                .currency(payment.getCurrency() != null ? payment.getCurrency() : "XAF")
                .status(refund.getStatus())
                .reason(refund.getReason())
                .createdAt(refund.getCreatedAt())
                .processedAt(refund.getProcessedAt())
                .build();
    }
}

