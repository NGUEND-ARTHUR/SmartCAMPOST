package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.analytics.AnomalyCheckResponse;
import com.smartcampost.backend.dto.analytics.EtaPredictionResponse;
import com.smartcampost.backend.service.AnalyticsService;
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
}