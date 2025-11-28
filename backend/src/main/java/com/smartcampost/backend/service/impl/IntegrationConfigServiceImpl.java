package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.integration.IntegrationConfigRequest;
import com.smartcampost.backend.dto.integration.IntegrationConfigResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.IntegrationConfig;
import com.smartcampost.backend.repository.IntegrationConfigRepository;
import com.smartcampost.backend.service.IntegrationConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IntegrationConfigServiceImpl implements IntegrationConfigService {

    private final IntegrationConfigRepository integrationConfigRepository;

    @Override
    public IntegrationConfigResponse createConfig(IntegrationConfigRequest request) {

        IntegrationConfig config = IntegrationConfig.builder()
                .id(UUID.randomUUID())
                .type(request.getType())
                .providerName(request.getProviderName())
                .apiKey(request.getApiKey())
                .apiSecret(request.getApiSecret())
                .endpointUrl(request.getEndpointUrl())
                .enabled(request.isEnabled())
                .createdAt(Instant.now())
                .build();

        integrationConfigRepository.save(config);

        return toResponse(config);
    }

    @Override
    public IntegrationConfigResponse updateConfig(UUID id, IntegrationConfigRequest request) {
        IntegrationConfig config = integrationConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Integration config not found",
                        ErrorCode.INTEGRATION_CONFIG_NOT_FOUND
                ));

        config.setType(request.getType());
        config.setProviderName(request.getProviderName());
        config.setApiKey(request.getApiKey());
        config.setApiSecret(request.getApiSecret());
        config.setEndpointUrl(request.getEndpointUrl());
        config.setEnabled(request.isEnabled());
        config.setUpdatedAt(Instant.now());

        integrationConfigRepository.save(config);

        return toResponse(config);
    }

    @Override
    public IntegrationConfigResponse getConfig(UUID id) {
        IntegrationConfig config = integrationConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Integration config not found",
                        ErrorCode.INTEGRATION_CONFIG_NOT_FOUND
                ));

        return toResponse(config);
    }

    @Override
    public Page<IntegrationConfigResponse> listConfigs(int page, int size) {
        return integrationConfigRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    private IntegrationConfigResponse toResponse(IntegrationConfig cfg) {
        return IntegrationConfigResponse.builder()
                .id(cfg.getId())
                .type(cfg.getType())
                .providerName(cfg.getProviderName())
                .endpointUrl(cfg.getEndpointUrl())
                .enabled(cfg.isEnabled())
                .createdAt(cfg.getCreatedAt())
                .updatedAt(cfg.getUpdatedAt())
                .build();
    }
}
