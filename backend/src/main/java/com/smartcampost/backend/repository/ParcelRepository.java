package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Parcel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ParcelRepository extends JpaRepository<Parcel, UUID> {

    Optional<Parcel> findByTrackingRef(String trackingRef);

    // Pour listClientParcels(UUID clientId)
    List<Parcel> findByClient_Id(UUID clientId);
}
