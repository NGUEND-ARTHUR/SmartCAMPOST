package com.smartcampost.backend.service;

public interface GeocodingService {

    String computeZoneFromAddress(String city, String region, String country);
}
