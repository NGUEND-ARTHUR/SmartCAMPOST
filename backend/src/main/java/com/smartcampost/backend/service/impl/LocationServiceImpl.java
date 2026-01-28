package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.model.Location;
import com.smartcampost.backend.repository.LocationRepository;
import com.smartcampost.backend.service.LocationService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;

    public LocationServiceImpl(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Override
    public Location saveLocation(Location loc) {
        return locationRepository.save(loc);
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
