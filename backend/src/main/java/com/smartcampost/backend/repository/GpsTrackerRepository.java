package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.GpsTracker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GpsTrackerRepository extends JpaRepository<GpsTracker, UUID> {
    Optional<GpsTracker> findByDeviceId(String deviceId);
    Optional<GpsTracker> findByImei(String imei);
}
