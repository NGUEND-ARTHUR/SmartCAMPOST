package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.repository.LocationRepository;
import com.smartcampost.backend.service.LocationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;

    public LocationServiceImpl(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Override
    public Location saveLocation(Location loc) {
        Objects.requireNonNull(loc, "loc is required");
        return Objects.requireNonNull(locationRepository.save(loc), "failed to save location");
    }

    @Override
    public List<Location> getRecentForUser(Long userId) {
        return locationRepository.findTop100ByUserIdOrderByTimestampDesc(userId);
    }

    @Override
    public List<Location> getRecentAll() {
        return locationRepository.findTop500ByOrderByTimestampDesc();
    }
}
