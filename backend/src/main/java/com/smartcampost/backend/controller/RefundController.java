package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.refund.*;
import com.smartcampost.backend.service.RefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PostMapping
    public ResponseEntity<RefundResponse> createRefund(
            @Valid @RequestBody CreateRefundRequest request
    ) {
        return ResponseEntity.ok(refundService.createRefund(request));
    }

    @PatchMapping("/{refundId}/status")
    public ResponseEntity<RefundResponse> updateStatus(
            @PathVariable UUID refundId,
            @Valid @RequestBody UpdateRefundStatusRequest request
    ) {
        return ResponseEntity.ok(refundService.updateRefundStatus(refundId, request));
    }

    @GetMapping("/{refundId}")
    public ResponseEntity<RefundResponse> getRefund(@PathVariable UUID refundId) {
        return ResponseEntity.ok(refundService.getRefundById(refundId));
    }

    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<List<RefundResponse>> getRefundsForPayment(
            @PathVariable UUID paymentId
    ) {
        return ResponseEntity.ok(refundService.getRefundsForPayment(paymentId));
    }

    @GetMapping
    public ResponseEntity<Page<RefundResponse>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(refundService.listAllRefunds(page, size));
    }
}
