package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Agency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AgencyRepository extends JpaRepository<Agency, UUID> {

    Optional<Agency> findByAgencyCode(String agencyCode);
}
