package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.pricing.PricingDetailResponse;
import com.smartcampost.backend.security.ParcelAuthorizationService;
import com.smartcampost.backend.service.PricingDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pricing-details")
@RequiredArgsConstructor
public class PricingDetailController {

    private final PricingDetailService pricingDetailService;
    private final ParcelAuthorizationService parcelAuthorizationService;

    // Admin : historique paginé d’un colis
    @GetMapping("/parcel/{parcelId}")
    @PreAuthorize("hasAnyRole('CLIENT','STAFF','ADMIN','FINANCE','RISK')")
    public ResponseEntity<Page<PricingDetailResponse>> listForParcel(
            @PathVariable UUID parcelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        parcelAuthorizationService.requirePricingAccess(parcelId, authentication);
        return ResponseEntity.ok(pricingDetailService.listByParcel(parcelId, page, size));
    }

    // Version non paginée (si besoin pour debug)
    @GetMapping("/parcel/{parcelId}/all")
    @PreAuthorize("hasAnyRole('CLIENT','STAFF','ADMIN','FINANCE','RISK')")
    public ResponseEntity<List<PricingDetailResponse>> historyForParcel(
            @PathVariable UUID parcelId,
            Authentication authentication
    ) {
        parcelAuthorizationService.requirePricingAccess(parcelId, authentication);
        return ResponseEntity.ok(pricingDetailService.historyForParcel(parcelId));
    }
}
