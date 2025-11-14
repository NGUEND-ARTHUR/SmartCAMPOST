package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.payment.PaymentInitRequest;
import com.smartcampost.backend.dto.payment.PaymentResponse;
import com.smartcampost.backend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody PaymentInitRequest request) {
        return ResponseEntity.ok(paymentService.initiatePayment(request));
    }

    @PostMapping("/{paymentId}/complete")
    public ResponseEntity<PaymentResponse> completePayment(@PathVariable UUID paymentId,
                                                           @RequestParam boolean success,
                                                           @RequestParam(required = false) String externalRef) {
        return ResponseEntity.ok(paymentService.completePayment(paymentId, success, externalRef));
    }

    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<List<PaymentResponse>> listForParcel(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(paymentService.listPaymentsForParcel(parcelId));
    }
}
