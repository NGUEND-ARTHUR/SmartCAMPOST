package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ParcelRepository extends JpaRepository<Parcel, UUID> {

    Optional<Parcel> findByTrackingRef(String trackingRef);

    boolean existsByTrackingRef(String trackingRef);

    Page<Parcel> findByClient_Id(UUID clientId, Pageable pageable);

    // Self-healing: count parcels at agency by status
    long countByDestinationAgency_IdAndStatusIn(UUID agencyId, List<ParcelStatus> statuses);

    // Self-healing: find parcels at agency by status
    List<Parcel> findByDestinationAgency_IdAndStatusIn(UUID agencyId, List<ParcelStatus> statuses);

    // Find parcels by status
    List<Parcel> findByStatusIn(List<ParcelStatus> statuses);

    // Find unlocked parcels (can be corrected)
    List<Parcel> findByLockedFalse();
}
