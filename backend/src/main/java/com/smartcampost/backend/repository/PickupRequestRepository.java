package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.PickupRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PickupRequestRepository extends JpaRepository<PickupRequest, UUID> {

    boolean existsByParcel_Id(UUID parcelId);

    Optional<PickupRequest> findByParcel_Id(UUID parcelId);

    Page<PickupRequest> findByParcel_Client_Id(UUID clientId, Pageable pageable);

    Page<PickupRequest> findByCourier_Id(UUID courierId, Pageable pageable);
}
