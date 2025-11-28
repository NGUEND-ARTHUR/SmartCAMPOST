package com.smartcampost.backend.dto.geo;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GeocodeResponse {

    private Double latitude;
    private Double longitude;
    private String normalizedAddress;
}