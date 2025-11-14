package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.tariff.TariffRequest;
import com.smartcampost.backend.dto.tariff.TariffResponse;
import com.smartcampost.backend.dto.tariff.TariffQuoteRequest;
import com.smartcampost.backend.dto.tariff.TariffQuoteResponse;
import com.smartcampost.backend.service.TariffPricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tariffs")
@RequiredArgsConstructor
public class TariffPricingController {

    private final TariffPricingService tariffPricingService;

    @PostMapping
    public ResponseEntity<TariffResponse> create(@Valid @RequestBody TariffRequest request) {
        return ResponseEntity.ok(tariffPricingService.createTariff(request));
    }

    @GetMapping
    public ResponseEntity<List<TariffResponse>> list() {
        return ResponseEntity.ok(tariffPricingService.listTariffs());
    }

    @GetMapping("/{tariffId}")
    public ResponseEntity<TariffResponse> get(@PathVariable UUID tariffId) {
        return ResponseEntity.ok(tariffPricingService.getTariff(tariffId));
    }

    @PostMapping("/quote")
    public ResponseEntity<TariffQuoteResponse> quote(@Valid @RequestBody TariffQuoteRequest request) {
        return ResponseEntity.ok(tariffPricingService.quotePrice(request));
    }
}
