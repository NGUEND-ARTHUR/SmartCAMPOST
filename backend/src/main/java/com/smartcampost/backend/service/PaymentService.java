package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.payment.ConfirmPaymentRequest;
import com.smartcampost.backend.dto.payment.InitPaymentRequest;
import com.smartcampost.backend.dto.payment.PaymentResponse;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PaymentService {

    PaymentResponse initPayment(InitPaymentRequest request);

    PaymentResponse confirmPayment(ConfirmPaymentRequest request);

    PaymentResponse getPaymentById(UUID paymentId);

    List<PaymentResponse> getPaymentsForParcel(UUID parcelId);

    Page<PaymentResponse> listAllPayments(int page, int size);

    // ==========================================================
    // 🔥 SPRINT 14 — COD SUPPORT (Cash On Delivery)
    // ==========================================================

    /**
     * Called when COD must be marked as PAID during the final delivery flow.
     */
    PaymentResponse markCodAsPaid(UUID parcelId);

    /**
     * Called when a COD parcel is created to register a PENDING COD payment.
     */
    PaymentResponse createCodPendingPayment(UUID parcelId);

    // ==========================================================
    // 🔥 SPRINT 14 — DELIVERY OPTION EXTRA CHARGE (AGENCY → HOME)
    // ==========================================================

    /**
     * Called when delivery option changes from AGENCY → HOME
     * and an additional amount must be charged.
     */
    PaymentResponse handleAdditionalDeliveryCharge(UUID parcelId, BigDecimal additionalAmount);

    // ==========================================================
    // 🔥 SPRINT 16 — PAYMENT AT DIFFERENT STAGES
    // ==========================================================

    /**
     * Create payment at registration stage (when parcel is created).
     * Called for PREPAID parcels.
     */
    PaymentResponse createRegistrationPayment(UUID parcelId);

    /**
     * Process payment during pickup.
     * Called when agent collects payment at home collection.
     */
    PaymentResponse processPickupPayment(UUID parcelId, String paymentMethod, Double amount);

    /**
     * Process payment at delivery.
     * Called when courier collects COD payment.
     */
    PaymentResponse processDeliveryPayment(UUID parcelId, String paymentMethod, Double amount);

    /**
     * Get payment summary for a parcel including all payments and balance.
     */
    PaymentSummary getPaymentSummary(UUID parcelId);

    /**
     * Payment summary with total due, paid, and balance.
     */
    record PaymentSummary(
            UUID parcelId,
            String trackingRef,
            Double totalDue,
            Double totalPaid,
            Double balance,
            String paymentOption,    // PREPAID or COD
            String paymentStatus,    // PAID, PARTIAL, PENDING
            java.util.List<PaymentResponse> payments
    ) {}
}
