package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.admin.FreezeAccountRequest;
import com.smartcampost.backend.dto.risk.RiskAlertUpdateRequest;
import com.smartcampost.backend.service.RiskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class RiskController {

    private final RiskService riskService;

    // ✅ List all risk alerts (risk dashboard)
    @GetMapping("/alerts")
    public ResponseEntity<Page<?>> listRiskAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(riskService.listRiskAlerts(page, size));
    }

    // ✅ Update alert (description/severity)
    @PatchMapping("/alerts/{alertId}")
    public ResponseEntity<Object> updateRiskAlert(
            @PathVariable UUID alertId,
            @Valid @RequestBody RiskAlertUpdateRequest request
    ) {
        return ResponseEntity.ok(
                riskService.updateRiskAlert(alertId, request.getDescription(), request.getSeverity())
        );
    }

    // ✅ Risk can freeze a user directly
    @PatchMapping("/users/{userId}/freeze")
    public ResponseEntity<Object> freezeUser(
            @PathVariable UUID userId,
            @Valid @RequestBody FreezeAccountRequest request
    ) {
        return ResponseEntity.ok(riskService.freezeUser(userId, request.getFrozen()));
    }
}
