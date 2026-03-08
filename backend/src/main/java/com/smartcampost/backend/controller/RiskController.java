package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.admin.FreezeAccountRequest;
import com.smartcampost.backend.dto.risk.RiskAlertUpdateRequest;
import com.smartcampost.backend.model.enums.RiskAlertType;
import com.smartcampost.backend.model.enums.RiskSeverity;
import com.smartcampost.backend.service.RiskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('RISK')")
public class RiskController {

    private final RiskService riskService;

    // ✅ Create a new risk alert (persisted via service)
    @PostMapping
    public ResponseEntity<Object> createRisk(
            @Valid @RequestBody CreateRiskRequest request
    ) {
        RiskAlertType type = RiskAlertType.valueOf(request.getType().trim().toUpperCase());
        RiskSeverity severity = RiskSeverity.valueOf(request.getSeverity().trim().toUpperCase());
        return ResponseEntity.ok(riskService.createRiskAlert(type, severity, request.getDescription()));
    }

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

    // Inner DTO class for creating risk alerts
    public static class CreateRiskRequest {
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        private String type;
        private String severity;
        private String description;
    }
}
