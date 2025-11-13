package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PickupRequest;
import com.smartcampost.backend.model.enums.PickupRequestState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PickupRequestRepository extends JpaRepository<PickupRequest, UUID> {

    Optional<PickupRequest> findByParcel(Parcel parcel);

    List<PickupRequest> findByState(PickupRequestState state);
}
