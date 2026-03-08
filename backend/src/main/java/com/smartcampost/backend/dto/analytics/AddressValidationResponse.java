package com.smartcampost.backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressValidationResponse {
    private boolean valid;
    private Double confidenceScore;
    private String normalizedAddress;
    private String normalizedCity;
    private String normalizedRegion;
    private String normalizedCountry;
    private List<String> issues;
    private List<String> suggestions;
}
