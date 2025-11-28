package com.smartcampost.backend.dto.geo;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RouteEtaRequest {

    @NotNull
    private Double fromLat;

    @NotNull
    private Double fromLng;

    @NotNull
    private Double toLat;

    @NotNull
    private Double toLng;
}