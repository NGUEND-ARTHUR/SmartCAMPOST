package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.geo.GeocodeRequest;
import com.smartcampost.backend.dto.geo.GeocodeResponse;
import com.smartcampost.backend.dto.geo.RouteEtaRequest;
import com.smartcampost.backend.dto.geo.RouteEtaResponse;
import com.smartcampost.backend.service.GeolocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GeolocationServiceImpl implements GeolocationService {

    // This is a MOCK implementation – no real external API.

    @Override
    public GeocodeResponse geocode(GeocodeRequest request) {

        // simple deterministic mock: hash address -> coordinates
        String addr = request.getAddressLine().trim();
        int hash = Math.abs(addr.hashCode());

        double lat = (hash % 18000) / 100.0 - 90.0;   // -90..+90
        double lng = (hash % 36000) / 100.0 - 180.0;  // -180..+180

        return GeocodeResponse.builder()
                .latitude(lat)
                .longitude(lng)
                .normalizedAddress(addr)
                .build();
    }

    @Override
    public RouteEtaResponse calculateRouteEta(RouteEtaRequest request) {

        // simple distance approximation (not accurate)
        double dLat = request.getToLat() - request.getFromLat();
        double dLng = request.getToLng() - request.getFromLng();
        double distanceKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // ~111km per degree

        // assume average speed 40km/h
        long durationSeconds = (long) ((distanceKm / 40.0) * 3600);

        return RouteEtaResponse.builder()
                .distanceKm(distanceKm)
                .durationSeconds(durationSeconds)
                .build();
    }
}
