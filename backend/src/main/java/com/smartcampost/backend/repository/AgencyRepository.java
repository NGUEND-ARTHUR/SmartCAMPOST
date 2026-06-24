package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Agency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgencyRepository extends JpaRepository<Agency, UUID> {

    Optional<Agency> findByAgencyCode(String agencyCode);

    List<Agency> findByRegionIgnoreCase(String region);

    List<Agency> findByCityIgnoreCase(String city);

    List<Agency> findByRegionIgnoreCaseAndCityIgnoreCase(String region, String city);
}
