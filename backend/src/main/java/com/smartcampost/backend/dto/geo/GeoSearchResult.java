package com.smartcampost.backend.dto.geo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GeoSearchResult {
    private Double latitude;
    private Double longitude;
    private String displayName;
    private String category;
    private String type;
    private String city;
    private String state;
    private String country;
}
