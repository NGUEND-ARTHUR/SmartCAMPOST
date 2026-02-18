package com.smartcampost.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.dto.geo.GeocodeRequest;
import com.smartcampost.backend.dto.geo.GeocodeResponse;
import com.smartcampost.backend.dto.geo.RouteEtaRequest;
import com.smartcampost.backend.dto.geo.RouteEtaResponse;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.service.GeolocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class GeolocationServiceImpl implements GeolocationService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private final ObjectMapper objectMapper;

    @Value("${geolocation.nominatim-url:https://nominatim.openstreetmap.org/search}")
    private String nominatimUrl;

    @Value("${geolocation.average-speed-kmh:40}")
    private double averageSpeedKmh;

    @Override
    public GeocodeResponse geocode(GeocodeRequest request) {

        try {
            if (request == null || request.getAddressLine() == null || request.getAddressLine().trim().isEmpty()) {
                throw new ConflictException(
                        "Invalid or empty address",
                        ErrorCode.GEOLOCATION_ERROR
                );
            }

            String addr = request.getAddressLine().trim();
            String encoded = URLEncoder.encode(addr, StandardCharsets.UTF_8);
            String url = nominatimUrl + "?q=" + encoded + "&format=json&limit=1";

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .header("User-Agent", "SmartCAMPOST/1.0 (support@smartcampost.cm)")
                    .GET()
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ConflictException("Geocoding provider unavailable", ErrorCode.GEOLOCATION_ERROR);
            }

            JsonNode root = objectMapper.readTree(response.body());
            if (!root.isArray() || root.isEmpty()) {
                throw new ConflictException("Address not found", ErrorCode.ROUTE_NOT_FOUND);
            }

            JsonNode first = root.get(0);
            double lat = first.path("lat").asDouble(Double.NaN);
            double lng = first.path("lon").asDouble(Double.NaN);
            String normalizedAddress = first.path("display_name").asText(addr);

            if (Double.isNaN(lat) || Double.isNaN(lng)) {
                throw new ConflictException("Geocoding response missing coordinates", ErrorCode.GEOLOCATION_ERROR);
            }

            return GeocodeResponse.builder()
                    .latitude(lat)
                    .longitude(lng)
                    .normalizedAddress(normalizedAddress)
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

                double distanceKm = haversineKm(
                    request.getFromLat(),
                    request.getFromLng(),
                    request.getToLat(),
                    request.getToLng()
                );

                double speed = averageSpeedKmh > 0 ? averageSpeedKmh : 40.0;
                long durationSeconds = Math.max(60L, (long) ((distanceKm / speed) * 3600));

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

    private double haversineKm(double fromLat, double fromLng, double toLat, double toLng) {
        double dLat = Math.toRadians(toLat - fromLat);
        double dLng = Math.toRadians(toLng - fromLng);
        double lat1 = Math.toRadians(fromLat);
        double lat2 = Math.toRadians(toLat);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
