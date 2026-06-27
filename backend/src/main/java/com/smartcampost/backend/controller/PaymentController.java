package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.payment.ConfirmPaymentRequest;
import com.smartcampost.backend.dto.payment.InitPaymentRequest;
import com.smartcampost.backend.dto.payment.PaymentResponse;
import com.smartcampost.backend.security.ParcelAuthorizationService;
import com.smartcampost.backend.service.PaymentService;
import com.smartcampost.backend.service.PaymentService.PaymentSummary;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final ParcelAuthorizationService parcelAuthorizationService;

    @PostMapping("/init")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentResponse> initPayment(
            @Valid @RequestBody InitPaymentRequest request
    ) {
        return ResponseEntity.ok(paymentService.initPayment(request));
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','STAFF')")
    public ResponseEntity<PaymentResponse> confirmPayment(
            @Valid @RequestBody ConfirmPaymentRequest request
    ) {
        return ResponseEntity.ok(paymentService.confirmPayment(request));
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable UUID paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    @GetMapping("/parcel/{parcelId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PaymentResponse>> getPaymentsForParcel(
            @PathVariable UUID parcelId,
            Authentication authentication
    ) {
        parcelAuthorizationService.requireReadableParcel(parcelId, authentication);
        return ResponseEntity.ok(paymentService.getPaymentsForParcel(parcelId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','STAFF')")
    public ResponseEntity<Page<PaymentResponse>> listAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(paymentService.listAllPayments(page, size));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PaymentResponse>> listMyPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(paymentService.listMyPayments(page, size));
    }

    @GetMapping("/exceptions")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','STAFF','RISK')")
    public ResponseEntity<List<PaymentResponse>> listPaymentExceptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        List<PaymentResponse> exceptions = paymentService.listAllPayments(page, size)
                .getContent()
                .stream()
                .filter(payment -> payment.getReversed() != null && payment.getReversed()
                        || payment.getStatus() != null && !"SUCCESS".equals(payment.getStatus().name()))
                .toList();
        return ResponseEntity.ok(exceptions);
    }

    @PostMapping("/registration/{parcelId}")
    @PreAuthorize("hasAnyRole('AGENT','STAFF','ADMIN')")
    public ResponseEntity<PaymentResponse> createRegistrationPayment(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(paymentService.createRegistrationPayment(parcelId));
    }

    @PostMapping("/pickup/{parcelId}")
    @PreAuthorize("hasAnyRole('COURIER','AGENT','STAFF','ADMIN')")
    public ResponseEntity<PaymentResponse> processPickupPayment(
            @PathVariable UUID parcelId,
            @RequestParam String paymentMethod,
            @RequestParam Double amount
    ) {
        return ResponseEntity.ok(paymentService.processPickupPayment(parcelId, paymentMethod, amount));
    }

    @PostMapping("/delivery/{parcelId}")
    @PreAuthorize("hasAnyRole('COURIER','AGENT','STAFF','ADMIN')")
    public ResponseEntity<PaymentResponse> processDeliveryPayment(
            @PathVariable UUID parcelId,
            @RequestParam String paymentMethod,
            @RequestParam Double amount
    ) {
        return ResponseEntity.ok(paymentService.processDeliveryPayment(parcelId, paymentMethod, amount));
    }

    /**
     * Agent or courier confirms cash payment received.
     * Creates a SUCCESS payment record + auto-generates invoice.
     */
    @PostMapping("/cash-confirm/{parcelId}")
    @PreAuthorize("hasAnyRole('AGENT','COURIER','STAFF','ADMIN')")
    public ResponseEntity<PaymentResponse> confirmCashPayment(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(paymentService.processPickupPayment(parcelId, "CASH", null));
    }

    @GetMapping("/summary/{parcelId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentSummary> getPaymentSummary(
            @PathVariable UUID parcelId,
            Authentication authentication
    ) {
        parcelAuthorizationService.requireReadableParcel(parcelId, authentication);
        return ResponseEntity.ok(paymentService.getPaymentSummary(parcelId));
    }

    /**
     * COD settlement: agent/courier validates that the COD amount was paid.
     * Marks the pending COD payment as SUCCESS and issues the PDF invoice/receipt.
     */
    @PreAuthorize("hasAnyRole('AGENT','COURIER','STAFF','ADMIN')")
    @PostMapping("/cod/{parcelId}/mark-paid")
    public ResponseEntity<PaymentResponse> markCodAsPaid(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(paymentService.markCodAsPaid(parcelId));
    }

    /**
     * Fapshi webhook callback. Unauthenticated (permitted in SecurityConfig).
     * Fapshi sends: { "transId": "...", "status": "SUCCESSFUL"|"FAILED"|"EXPIRED", "amount": ..., "medium": "..." }
     */
    @PostMapping("/webhooks/fapshi")
    public ResponseEntity<Void> handleFapshiWebhook(@RequestBody Map<String, Object> payload) {
        String transId = payload.get("transId") != null ? payload.get("transId").toString() : null;
        String status = payload.get("status") != null ? payload.get("status").toString() : null;
        Double amount = null;
        if (payload.get("amount") != null) {
            try {
                amount = Double.valueOf(payload.get("amount").toString());
            } catch (NumberFormatException ignored) {}
        }
        paymentService.handleFapshiWebhook(transId, status, amount);
        return ResponseEntity.ok().build();
    }
}
