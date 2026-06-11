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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

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
            @PathVariable UUID parcelId
    ) {
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

    @GetMapping("/summary/{parcelId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentSummary> getPaymentSummary(
            @PathVariable UUID parcelId
    ) {
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
}
