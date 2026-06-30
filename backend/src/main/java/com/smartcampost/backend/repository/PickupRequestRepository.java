package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.PickupRequest;
import com.smartcampost.backend.model.enums.PickupRequestState;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PickupRequestRepository extends JpaRepository<PickupRequest, UUID> {

    boolean existsByParcel_Id(UUID parcelId);

    Optional<PickupRequest> findByParcel_Id(UUID parcelId);

    Page<PickupRequest> findByParcel_Client_Id(UUID clientId, Pageable pageable);

    Page<PickupRequest> findByCourier_Id(UUID courierId, Pageable pageable);

    /** All pickups assigned to a specific courier in a given state (no pagination needed for map). */
    List<PickupRequest> findByCourier_IdAndState(UUID courierId, PickupRequestState state);

    boolean existsByParcel_IdAndCourier_IdAndState(UUID parcelId, UUID courierId, PickupRequestState state);
}
