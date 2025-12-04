package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.geo.GeocodeRequest;
import com.smartcampost.backend.dto.geo.GeocodeResponse;
import com.smartcampost.backend.dto.geo.RouteEtaRequest;
import com.smartcampost.backend.dto.geo.RouteEtaResponse;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.service.GeolocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GeolocationServiceImpl implements GeolocationService {

    // ============================================================
    // MOCK IMPLEMENTATION — with error-code–based validation
    // ============================================================

    @Override
    public GeocodeResponse geocode(GeocodeRequest request) {

        try {
            if (request == null || request.getAddressLine() == null || request.getAddressLine().trim().isEmpty()) {
                throw new ConflictException(
                        "Invalid or empty address",
                        ErrorCode.GEOLOCATION_ERROR
                );
            }

            // ----- Original Mock Logic (unchanged) -----
            String addr = request.getAddressLine().trim();
            int hash = Math.abs(addr.hashCode());

            double lat = (hash % 18000) / 100.0 - 90.0;   // -90 .. +90
            double lng = (hash % 36000) / 100.0 - 180.0;  // -180 .. +180

            return GeocodeResponse.builder()
                    .latitude(lat)
                    .longitude(lng)
                    .normalizedAddress(addr)
                    .build();

        } catch (ConflictException ex) {
            throw ex; // keep geolocation-specific errors

        } catch (Exception ex) {
            // Anything unexpected:
            throw new ConflictException(
                    "Failed to geocode address",
                    ErrorCode.GEOLOCATION_ERROR
            );
        }
    }

    @Override
    public RouteEtaResponse calculateRouteEta(RouteEtaRequest request) {

        try {
            // ============= Validate input for ROUTE_NOT_FOUND ============
            if (request == null) {
                throw new ConflictException(
                        "Missing route information",
                        ErrorCode.ROUTE_NOT_FOUND
                );
            }

            if (request.getFromLat() == null || request.getFromLng() == null ||
                    request.getToLat() == null || request.getToLng() == null) {
                throw new ConflictException(
                        "Incomplete route coordinates",
                        ErrorCode.ROUTE_NOT_FOUND
                );
            }

            // ----- Original ETA Logic (unchanged) -----
            double dLat = request.getToLat() - request.getFromLat();
            double dLng = request.getToLng() - request.getFromLng();
            double distanceKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // ~111 km per degree

            long durationSeconds = (long) ((distanceKm / 40.0) * 3600); // avg 40 km/h

            return RouteEtaResponse.builder()
                    .distanceKm(distanceKm)
                    .durationSeconds(durationSeconds)
                    .build();

        } catch (ConflictException ex) {
            throw ex; // preserve ROUTE_NOT_FOUND

        } catch (Exception ex) {
            throw new ConflictException(
                    "Failed to compute route ETA",
                    ErrorCode.GEOLOCATION_ERROR
            );
        }
    }
}
