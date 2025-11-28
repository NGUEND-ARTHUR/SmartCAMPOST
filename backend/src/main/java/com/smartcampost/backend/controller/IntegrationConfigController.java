package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.integration.*;
import com.smartcampost.backend.service.IntegrationConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
public class IntegrationConfigController {

    private final IntegrationConfigService integrationConfigService;

    @PostMapping
    public ResponseEntity<IntegrationConfigResponse> create(
            @Valid @RequestBody IntegrationConfigRequest request
    ) {
        return ResponseEntity.ok(integrationConfigService.createConfig(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IntegrationConfigResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody IntegrationConfigRequest request
    ) {
        return ResponseEntity.ok(integrationConfigService.updateConfig(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IntegrationConfigResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(integrationConfigService.getConfig(id));
    }

    @GetMapping
    public ResponseEntity<Page<IntegrationConfigResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(integrationConfigService.listConfigs(page, size));
    }
}