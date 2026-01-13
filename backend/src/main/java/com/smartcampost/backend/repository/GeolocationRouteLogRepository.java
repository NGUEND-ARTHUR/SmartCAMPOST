package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.GeolocationRouteLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GeolocationRouteLogRepository extends JpaRepository<GeolocationRouteLog, UUID> {
    
    List<GeolocationRouteLog> findByParcelId(UUID parcelId);
    
    List<GeolocationRouteLog> findByProvider(String provider);
    
    List<GeolocationRouteLog> findByParcelIdOrderByCreatedAtDesc(UUID parcelId);
}
