package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.tariff.CreateTariffRequest;
import com.smartcampost.backend.dto.tariff.TariffQuoteRequest;
import com.smartcampost.backend.dto.tariff.TariffQuoteResponse;
import com.smartcampost.backend.dto.tariff.TariffResponse;
import com.smartcampost.backend.dto.tariff.UpdateTariffRequest;
import com.smartcampost.backend.service.TariffPricingService;
import com.smartcampost.backend.service.TariffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/tariffs")
@RequiredArgsConstructor
public class TariffController {

    private final TariffService tariffService;
    private final TariffPricingService tariffPricingService;

    // ========= CRUD TARIFFS =========

    @PostMapping
    public ResponseEntity<TariffResponse> create(@Valid @RequestBody CreateTariffRequest request) {
        return ResponseEntity.ok(tariffService.createTariff(request));
    }

    @GetMapping
    public ResponseEntity<Page<TariffResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String serviceType
    ) {
        return ResponseEntity.ok(tariffService.listTariffs(page, size, serviceType));
    }

    @GetMapping("/{tariffId}")
    public ResponseEntity<TariffResponse> get(@PathVariable UUID tariffId) {
        return ResponseEntity.ok(tariffService.getTariffById(tariffId));
    }

    @PutMapping("/{tariffId}")
    public ResponseEntity<TariffResponse> update(
            @PathVariable UUID tariffId,
            @Valid @RequestBody UpdateTariffRequest request
    ) {
        return ResponseEntity.ok(tariffService.updateTariff(tariffId, request));
    }

    @DeleteMapping("/{tariffId}")
    public ResponseEntity<Void> delete(@PathVariable UUID tariffId) {
        tariffService.deleteTariff(tariffId);
        return ResponseEntity.noContent().build();
    }

    // ========= PRICING / QUOTE =========

    @PostMapping("/quote")
    public ResponseEntity<TariffQuoteResponse> quote(@Valid @RequestBody TariffQuoteRequest request) {
        return ResponseEntity.ok(tariffPricingService.quotePrice(request));
    }
}
