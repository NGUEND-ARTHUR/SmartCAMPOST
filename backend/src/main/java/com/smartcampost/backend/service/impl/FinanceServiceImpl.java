package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.refund.RefundResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.Refund;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.model.enums.RefundStatus;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.repository.RefundRepository;
import com.smartcampost.backend.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FinanceServiceImpl implements FinanceService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<RefundResponse> listRefunds(int page, int size) {
        return refundRepository.findAll(PageRequest.of(page, size)).map(this::toResponse);
    }

    @Override
    @Transactional
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

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        List<Payment> allPayments = paymentRepository.findAll();

        double totalRevenue = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount)
                .sum();

        double pendingPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING || p.getStatus() == PaymentStatus.INIT)
                .mapToDouble(Payment::getAmount)
                .sum();

        double completedPayments = totalRevenue;

        List<Refund> pendingRefunds = refundRepository.findByStatus(RefundStatus.REQUESTED);
        double refundsPending = pendingRefunds.stream().mapToDouble(Refund::getAmount).sum();

        long totalPaymentCount = allPayments.size();
        long successCount = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.SUCCESS).count();
        long pendingCount = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.PENDING || p.getStatus() == PaymentStatus.INIT).count();
        long failedCount = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.FAILED).count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("pendingPayments", pendingPayments);
        stats.put("completedPayments", completedPayments);
        stats.put("refundsPending", refundsPending);
        stats.put("totalPaymentCount", totalPaymentCount);
        stats.put("successCount", successCount);
        stats.put("pendingCount", pendingCount);
        stats.put("failedCount", failedCount);
        return stats;
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

