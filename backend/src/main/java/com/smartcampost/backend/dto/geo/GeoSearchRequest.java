package com.smartcampost.backend.dto.geo;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GeoSearchRequest {

    @NotBlank
    @JsonAlias({"q", "query", "address", "addressLine"})
    private String query;

    @Min(1)
    @Max(10)
    private Integer limit;
}
