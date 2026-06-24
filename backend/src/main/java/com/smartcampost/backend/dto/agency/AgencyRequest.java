package com.smartcampost.backend.dto.agency;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgencyRequest {
    @NotBlank
    private String agencyName;
    private String agencyCode;
    private String city;
    private String region;
    private String country;
}
