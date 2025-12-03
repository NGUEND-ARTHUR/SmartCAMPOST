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
}
