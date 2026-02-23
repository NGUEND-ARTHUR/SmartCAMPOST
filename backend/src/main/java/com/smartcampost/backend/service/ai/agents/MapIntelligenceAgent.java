package com.smartcampost.backend.service.ai.agents;

import com.smartcampost.backend.dto.geo.GeoSearchRequest;
import com.smartcampost.backend.dto.geo.GeoSearchResult;
import com.smartcampost.backend.service.GeolocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MapIntelligenceAgent {

    private final GeolocationService geolocationService;
    private final DataOptimizationAgent dataOptimizationAgent;

    @SuppressWarnings("unchecked")
    public List<GeoSearchResult> search(GeoSearchRequest request) {
        String query = request != null && request.getQuery() != null ? request.getQuery().trim() : "";
        int limit = request != null && request.getLimit() != null ? request.getLimit() : 5;
        String key = query.toLowerCase() + "|" + limit;

        // Cache for short TTL to avoid hitting Nominatim on each keystroke
        return dataOptimizationAgent.getOrCompute(
                "map-intel-search",
                key,
                Duration.ofSeconds(45),
                List.class,
                () -> geolocationService.search(request)
        );
    }
}
