package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.model.enums.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TariffRepository extends JpaRepository<Tariff, UUID> {

    List<Tariff> findByServiceTypeAndOriginZoneAndDestinationZone(
            ServiceType serviceType,
            String originZone,
            String destinationZone
    );
}
