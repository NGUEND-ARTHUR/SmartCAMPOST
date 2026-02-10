package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.pricing.PricingQuoteResponse;
import com.smartcampost.backend.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping("/quote/{parcelId}")
    public ResponseEntity<PricingQuoteResponse> quote(@PathVariable UUID parcelId) {
        UUID pid = Objects.requireNonNull(parcelId, "parcelId is required");
        BigDecimal quote = Objects.requireNonNull(pricingService.quotePrice(pid), "quote is required");

        return ResponseEntity.ok(
                PricingQuoteResponse.builder()
                        .parcelId(pid)
                        .amount(quote)
                        .currency("XAF")
                        .build()
        );
    }
}
