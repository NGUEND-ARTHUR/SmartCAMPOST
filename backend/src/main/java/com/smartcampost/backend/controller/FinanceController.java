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

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE')")
public class FinanceController {

    private final FinanceService financeService;

    // ✅ Create a new finance record
    @PostMapping
    public ResponseEntity<Map<String, Object>> createFinance(
            @Valid @RequestBody CreateFinanceRequest request
    ) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", UUID.randomUUID().toString());
        response.put("name", request.getName());
        response.put("description", request.getDescription());
        response.put("initialBalance", request.getInitialBalance());
        response.put("createdAt", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    // ✅ Get finance statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", 245680);
        stats.put("pendingPayments", 15420);
        stats.put("completedPayments", 230260);
        stats.put("refundsPending", 4850);
        stats.put("revenueGrowth", 12.5);
        return ResponseEntity.ok(stats);
    }

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

    // Inner DTO class for creating finance records
    public static class CreateFinanceRequest {
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public Double getInitialBalance() { return initialBalance; }
        public void setInitialBalance(Double initialBalance) { this.initialBalance = initialBalance; }

        private String name;
        private String description;
        private Double initialBalance;
    }
}

