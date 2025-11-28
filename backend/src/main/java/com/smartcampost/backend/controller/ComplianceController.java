package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.compliance.*;
import com.smartcampost.backend.service.ComplianceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
public class ComplianceController {

    private final ComplianceService complianceService;

    @GetMapping("/alerts")
    public ResponseEntity<Page<RiskAlertResponse>> listAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(complianceService.listRiskAlerts(page, size));
    }

    @GetMapping("/alerts/{id}")
    public ResponseEntity<RiskAlertResponse> getAlert(@PathVariable UUID id) {
        return ResponseEntity.ok(complianceService.getRiskAlertById(id));
    }

    @PatchMapping("/alerts/{id}")
    public ResponseEntity<RiskAlertResponse> resolveAlert(
            @PathVariable UUID id,
            @Valid @RequestBody ResolveRiskAlertRequest request
    ) {
        return ResponseEntity.ok(complianceService.resolveRiskAlert(id, request));
    }

    @GetMapping("/reports")
    public ResponseEntity<ComplianceReportResponse> generateReport(
            @RequestParam String from,
            @RequestParam String to
    ) {
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        return ResponseEntity.ok(complianceService.generateComplianceReport(fromDate, toDate));
    }

    @PostMapping("/accounts/{userId}/freeze")
    public ResponseEntity<Void> freezeAccount(@PathVariable UUID userId) {
        complianceService.freezeAccount(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/accounts/{userId}/unfreeze")
    public ResponseEntity<Void> unfreezeAccount(@PathVariable UUID userId) {
        complianceService.unfreezeAccount(userId);
        return ResponseEntity.noContent().build();
    }
}