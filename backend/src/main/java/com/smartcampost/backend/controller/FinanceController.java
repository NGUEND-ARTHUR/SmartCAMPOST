package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.finance.UpdateRefundStatusRequest;
import com.smartcampost.backend.dto.refund.RefundResponse;
import com.smartcampost.backend.service.FinanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE')")
public class FinanceController {

    private final FinanceService financeService;

    // ✅ Refund list (for finance dashboard)
    @GetMapping("/refunds")
    public ResponseEntity<Page<RefundResponse>> listRefunds(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(financeService.listRefunds(page, size));
    }

    // ✅ Approve / Reject / Process refunds
    @PatchMapping("/refunds/{refundId}/status")
    public ResponseEntity<RefundResponse> updateRefundStatus(
            @PathVariable UUID refundId,
            @Valid @RequestBody UpdateRefundStatusRequest request
    ) {
        return ResponseEntity.ok(financeService.updateRefundStatus(refundId, request.getStatus()));
    }
}

