package com.smartcampost.backend.dto.integration;
import com.smartcampost.backend.model.enums.IntegrationType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class IntegrationConfigResponse {

    private UUID id;
    private IntegrationType type;
    private String providerName;
    private String endpointUrl;
    private boolean enabled;
    private Instant createdAt;
    private Instant updatedAt;
}