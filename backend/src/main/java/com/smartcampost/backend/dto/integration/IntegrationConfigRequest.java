package com.smartcampost.backend.dto.integration;
import com.smartcampost.backend.model.enums.IntegrationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IntegrationConfigRequest {

    @NotNull
    private IntegrationType type;

    @NotBlank
    private String providerName;

    private String apiKey;
    private String apiSecret;
    private String endpointUrl;

    private boolean enabled = true;
}