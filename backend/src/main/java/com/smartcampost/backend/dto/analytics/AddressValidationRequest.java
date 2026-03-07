package com.smartcampost.backend.dto.analytics;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressValidationRequest {
    @NotBlank
    private String street;
    private String city;
    private String region;
    private String country;
    private String postalCode;
}
