package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.analytics.*;
import com.smartcampost.backend.service.AnalyticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final com.smartcampost.backend.security.ParcelAuthorizationService parcelAuthorizationService;

    @GetMapping("/parcels/{parcelId}/eta")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EtaPredictionResponse> predictEta(@PathVariable UUID parcelId, Authentication authentication) {
        parcelAuthorizationService.requireReadableParcel(parcelId, authentication);
        return ResponseEntity.ok(analyticsService.predictEtaForParcel(parcelId));
    }

    @GetMapping("/payments/{paymentId}/anomaly")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','FINANCE','RISK')")
    public ResponseEntity<AnomalyCheckResponse> checkPaymentAnomaly(@PathVariable UUID paymentId) {
        return ResponseEntity.ok(analyticsService.checkPaymentAnomaly(paymentId));
    }

    @PostMapping("/demand-forecast")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','FINANCE','RISK')")
    public ResponseEntity<DemandForecastResponse> forecastDemand(@Valid @RequestBody DemandForecastRequest request) {
        return ResponseEntity.ok(analyticsService.forecastDemand(request));
    }

    @GetMapping("/sentiment")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','FINANCE','RISK')")
    public ResponseEntity<SentimentAnalysisResponse> analyzeSentiment() {
        return ResponseEntity.ok(analyticsService.analyzeSentiment());
    }

    @GetMapping("/smart-notifications")
    @PreAuthorize("isAuthenticated() and !hasAnyRole('CLIENT','COURIER')")
    public ResponseEntity<SmartNotificationResponse> getSmartNotifications() {
        return ResponseEntity.ok(analyticsService.getSmartNotifications());
    }

    @GetMapping("/route-optimization")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','FINANCE','RISK')")
    public ResponseEntity<Map<String, Object>> getRouteOptimization() {
        return ResponseEntity.ok(analyticsService.getRouteOptimization());
    }

    @PostMapping("/validate-address")
    public ResponseEntity<AddressValidationResponse> validateAddress(@Valid @RequestBody AddressValidationRequest request) {
        return ResponseEntity.ok(analyticsService.validateAddress(request));
    }
}
