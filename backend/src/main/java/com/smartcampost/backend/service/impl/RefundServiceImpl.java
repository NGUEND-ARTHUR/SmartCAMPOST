package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.refund.CreateRefundRequest;
import com.smartcampost.backend.dto.refund.RefundResponse;
import com.smartcampost.backend.dto.refund.UpdateRefundStatusRequest;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.Refund;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.RefundStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.repository.RefundRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final ParcelRepository parcelRepository;
    private final ClientRepository clientRepository;
    private final UserAccountRepository userAccountRepository;

    // ================== CREATE REFUND ==================
    @Override
    public RefundResponse createRefund(CreateRefundRequest request) {

        UserAccount user = getCurrentUserAccount();

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found",
                        ErrorCode.PAYMENT_NOT_FOUND
                ));

        Parcel parcel = payment.getParcel();
        Client client = parcel.getClient();

        // Clients can only request refunds for their own payments
        if (user.getRole() == UserRole.CLIENT) {
            if (!client.getId().equals(user.getEntityId())) {
                throw new AuthException(
                        ErrorCode.AUTH_FORBIDDEN,
                        "You do not own this payment"
                );
            }
        }

        // ❌ NEW: Prevent refund on reversed/chargebacked payment
        if (payment.isReversed() != null && payment.isReversed()) {
            throw new ConflictException(
                    "Payment already reversed, cannot issue refund",
                    ErrorCode.CHARGEBACK_CONFLICT
            );
        }

        // Basic amount check (no over-refund)
        if (request.getAmount() > payment.getAmount()) {
            throw new ConflictException(
                    "Refund amount cannot exceed original payment amount",
                    ErrorCode.REFUND_CONFLICT
            );
        }

        Refund refund = Refund.builder()
                .id(UUID.randomUUID())
                .payment(payment)
                .amount(request.getAmount())
                .reason(request.getReason())
                .status(RefundStatus.REQUESTED)
                .createdAt(Instant.now())
                .build();

        refundRepository.save(refund);

        return toResponse(refund);
    }

    // ================== UPDATE STATUS ==================
    @Override
    public RefundResponse updateRefundStatus(UUID refundId, UpdateRefundStatusRequest request) {

        UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(
                    ErrorCode.AUTH_FORBIDDEN,
                    "Not allowed to update refund status"
            );
        }

        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Refund not found",
                        ErrorCode.REFUND_NOT_FOUND
                ));

        // 🔥 Prevent re-processing a processed refund
        if (refund.getStatus() == RefundStatus.PROCESSED) {
            throw new ConflictException(
                    "Refund is already processed",
                    ErrorCode.REFUND_ALREADY_PROCESSED
            );
        }

        refund.setStatus(request.getStatus());

        if (request.getStatus() == RefundStatus.PROCESSED) {
            refund.setProcessedAt(Instant.now());
        }

        refundRepository.save(refund);

        return toResponse(refund);
    }

    // ================== GET BY ID ==================
    @Override
    public RefundResponse getRefundById(UUID refundId) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Refund/Chargeback not found",
                        ErrorCode.CHARGEBACK_NOT_FOUND
                ));

        enforceAccess(refund);

        return toResponse(refund);
    }

    // ================== REFUNDS FOR PAYMENT ==================
    @Override
    public List<RefundResponse> getRefundsForPayment(UUID paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found",
                        ErrorCode.PAYMENT_NOT_FOUND
                ));

        List<Refund> refunds = refundRepository.findByPayment(payment);

        if (refunds.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No refund/chargeback found for this payment",
                    ErrorCode.CHARGEBACK_NOT_FOUND
            );
        }

        enforceAccess(refunds.get(0));

        return refunds.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ================== LIST ALL ==================
    @Override
    public Page<RefundResponse> listAllRefunds(int page, int size) {
        UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(
                    ErrorCode.AUTH_FORBIDDEN,
                    "Not allowed to list all refunds"
            );
        }

        return refundRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== ACCESS HELPERS ==================
    private void enforceAccess(Refund refund) {
        Payment payment = refund.getPayment();
        enforcePaymentAccess(payment);
    }

    private void enforcePaymentAccess(Payment payment) {
        UserAccount user = getCurrentUserAccount();
        Parcel parcel = payment.getParcel();
        Client client = parcel.getClient();

        if (user.getRole() == UserRole.CLIENT) {
            if (!client.getId().equals(user.getEntityId())) {
                throw new AuthException(
                        ErrorCode.AUTH_FORBIDDEN,
                        "You cannot access this refund"
                );
            }
        }

        if (user.getRole() == UserRole.COURIER) {
            throw new AuthException(
                    ErrorCode.AUTH_FORBIDDEN,
                    "Courier cannot access refunds"
            );
        }
    }

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

    // ================== MAPPER ==================
    private RefundResponse toResponse(Refund refund) {
        Payment payment = refund.getPayment();
        Parcel parcel = payment.getParcel();

        return RefundResponse.builder()
                .id(refund.getId())
                .paymentId(payment.getId())
                .parcelId(parcel.getId())
                .parcelTrackingRef(parcel.getTrackingRef())
                .amount(refund.getAmount())
                .status(refund.getStatus())
                .reason(refund.getReason())
                .createdAt(refund.getCreatedAt())
                .processedAt(refund.getProcessedAt())
                .build();
    }
}
