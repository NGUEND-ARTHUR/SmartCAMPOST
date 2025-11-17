package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.model.enums.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TariffRepository extends JpaRepository<Tariff, UUID> {

    Optional<Tariff> findFirstByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
            ServiceType serviceType,
            String originZone,
            String destinationZone,
            String weightBracket
    );
}
