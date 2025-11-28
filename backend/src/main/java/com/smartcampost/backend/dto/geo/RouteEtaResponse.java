package com.smartcampost.backend.dto.geo;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RouteEtaResponse {

    private Long durationSeconds;
    private Double distanceKm;
}