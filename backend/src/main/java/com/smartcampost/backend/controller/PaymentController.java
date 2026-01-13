package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.payment.ConfirmPaymentRequest;
import com.smartcampost.backend.dto.payment.InitPaymentRequest;
import com.smartcampost.backend.dto.payment.PaymentResponse;
import com.smartcampost.backend.service.PaymentService;
import com.smartcampost.backend.service.PaymentService.PaymentSummary;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // US35: init payment
    @PostMapping("/init")
    public ResponseEntity<PaymentResponse> initPayment(
            @Valid @RequestBody InitPaymentRequest request
    ) {
        return ResponseEntity.ok(paymentService.initPayment(request));
    }

    // US36: confirm payment (callback interne)
    @PostMapping("/confirm")
    public ResponseEntity<PaymentResponse> confirmPayment(
            @Valid @RequestBody ConfirmPaymentRequest request
    ) {
        return ResponseEntity.ok(paymentService.confirmPayment(request));
    }

    // Get one payment
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable UUID paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    // US37: Payment history for a parcel
    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsForParcel(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(paymentService.getPaymentsForParcel(parcelId));
    }

    // Admin/staff: list all payments
    @GetMapping
    public ResponseEntity<Page<PaymentResponse>> listAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(paymentService.listAllPayments(page, size));
    }

    // ======================================================
    // 🔥 SPRINT 16 — PAYMENT WORKFLOW INTEGRATION
    // ======================================================

    /**
     * Create payment entry for parcel registration (PREPAID option)
     */
    @PostMapping("/registration/{parcelId}")
    public ResponseEntity<PaymentResponse> createRegistrationPayment(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(paymentService.createRegistrationPayment(parcelId));
    }

    /**
     * Process payment collected during home pickup
     */
    @PostMapping("/pickup/{parcelId}")
    public ResponseEntity<PaymentResponse> processPickupPayment(
            @PathVariable UUID parcelId,
            @RequestParam String paymentMethod,
            @RequestParam Double amount
    ) {
        return ResponseEntity.ok(paymentService.processPickupPayment(parcelId, paymentMethod, amount));
    }

    /**
     * Process COD payment at delivery
     */
    @PostMapping("/delivery/{parcelId}")
    public ResponseEntity<PaymentResponse> processDeliveryPayment(
            @PathVariable UUID parcelId,
            @RequestParam String paymentMethod,
            @RequestParam Double amount
    ) {
        return ResponseEntity.ok(paymentService.processDeliveryPayment(parcelId, paymentMethod, amount));
    }

    /**
     * Get complete payment summary for a parcel
     */
    @GetMapping("/summary/{parcelId}")
    public ResponseEntity<PaymentSummary> getPaymentSummary(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(paymentService.getPaymentSummary(parcelId));
    }
}
