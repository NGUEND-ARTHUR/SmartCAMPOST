package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Location;

import java.util.List;

public interface LocationService {
    Location saveLocation(Location loc);
    List<Location> getRecentForUser(Long userId);
    List<Location> getRecentAll();
}
