package com.smartcampost.backend.dto.geo;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GeocodeRequest {

    @NotBlank
    private String addressLine;
}