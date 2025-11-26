package com.smartcampost.backend.dto.client;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdatePreferredLanguageRequest {

    @NotBlank(message = "Preferred language is required")
    private String preferredLanguage;
}
