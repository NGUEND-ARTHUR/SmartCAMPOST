package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.finance.UpdateRefundStatusRequest;
import com.smartcampost.backend.service.FinanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    // ✅ Refund list (for finance dashboard)
    @GetMapping("/refunds")
    public ResponseEntity<Page<?>> listRefunds(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(financeService.listRefunds(page, size));
    }

    // ✅ Approve / Reject / Process refunds
    @PatchMapping("/refunds/{refundId}/status")
    public ResponseEntity<Object> updateRefundStatus(
            @PathVariable UUID refundId,
            @Valid @RequestBody UpdateRefundStatusRequest request
    ) {
        return ResponseEntity.ok(financeService.updateRefundStatus(refundId, request.getStatus()));
    }
}
