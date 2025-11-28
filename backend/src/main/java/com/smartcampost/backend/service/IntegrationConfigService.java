package com.smartcampost.backend.service;
import com.smartcampost.backend.dto.integration.IntegrationConfigRequest;
import com.smartcampost.backend.dto.integration.IntegrationConfigResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface IntegrationConfigService {

    IntegrationConfigResponse createConfig(IntegrationConfigRequest request);

    IntegrationConfigResponse updateConfig(UUID id, IntegrationConfigRequest request);

    IntegrationConfigResponse getConfig(UUID id);

    Page<IntegrationConfigResponse> listConfigs(int page, int size);
}