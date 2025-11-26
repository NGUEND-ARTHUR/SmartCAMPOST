package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.pricing.PricingDetailResponse;
import com.smartcampost.backend.service.PricingDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pricing-details")
@RequiredArgsConstructor
public class PricingDetailController {

    private final PricingDetailService pricingDetailService;

    // Admin : historique paginé d’un colis
    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<Page<PricingDetailResponse>> listForParcel(
            @PathVariable UUID parcelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(pricingDetailService.listByParcel(parcelId, page, size));
    }

    // Version non paginée (si besoin pour debug)
    @GetMapping("/parcel/{parcelId}/all")
    public ResponseEntity<List<PricingDetailResponse>> historyForParcel(
            @PathVariable UUID parcelId
    ) {
        return ResponseEntity.ok(pricingDetailService.historyForParcel(parcelId));
    }
}
