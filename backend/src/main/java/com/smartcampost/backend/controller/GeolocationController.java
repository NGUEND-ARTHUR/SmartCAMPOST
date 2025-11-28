package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.geo.*;
import com.smartcampost.backend.service.GeolocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/geo")
@RequiredArgsConstructor
public class GeolocationController {

    private final GeolocationService geolocationService;

    @PostMapping("/geocode")
    public ResponseEntity<GeocodeResponse> geocode(
            @Valid @RequestBody GeocodeRequest request
    ) {
        return ResponseEntity.ok(geolocationService.geocode(request));
    }

    @PostMapping("/route-eta")
    public ResponseEntity<RouteEtaResponse> routeEta(
            @Valid @RequestBody RouteEtaRequest request
    ) {
        return ResponseEntity.ok(geolocationService.calculateRouteEta(request));
    }
}