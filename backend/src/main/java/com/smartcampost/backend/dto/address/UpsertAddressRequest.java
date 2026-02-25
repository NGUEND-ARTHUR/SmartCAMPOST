package com.smartcampost.backend.dto.address;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpsertAddressRequest {

    @NotBlank
    private String label;

    private String street;

    @NotBlank
    private String city;

    @NotBlank
    private String region;

    @NotBlank
    private String country;

    private Double latitude;

    private Double longitude;
}
