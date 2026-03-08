package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.analytics.*;
import com.smartcampost.backend.service.AnalyticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/parcels/{parcelId}/eta")
    public ResponseEntity<EtaPredictionResponse> predictEta(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(analyticsService.predictEtaForParcel(parcelId));
    }

    @GetMapping("/payments/{paymentId}/anomaly")
    public ResponseEntity<AnomalyCheckResponse> checkPaymentAnomaly(@PathVariable UUID paymentId) {
        return ResponseEntity.ok(analyticsService.checkPaymentAnomaly(paymentId));
    }

    @PostMapping("/demand-forecast")
    public ResponseEntity<DemandForecastResponse> forecastDemand(@RequestBody DemandForecastRequest request) {
        return ResponseEntity.ok(analyticsService.forecastDemand(request));
    }

    @GetMapping("/sentiment")
    public ResponseEntity<SentimentAnalysisResponse> analyzeSentiment() {
        return ResponseEntity.ok(analyticsService.analyzeSentiment());
    }

    @GetMapping("/smart-notifications")
    public ResponseEntity<SmartNotificationResponse> getSmartNotifications() {
        return ResponseEntity.ok(analyticsService.getSmartNotifications());
    }

    @PostMapping("/validate-address")
    public ResponseEntity<AddressValidationResponse> validateAddress(@Valid @RequestBody AddressValidationRequest request) {
        return ResponseEntity.ok(analyticsService.validateAddress(request));
    }
}