package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Parcel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ParcelRepository extends JpaRepository<Parcel, UUID> {

    Optional<Parcel> findByTrackingRef(String trackingRef);

    boolean existsByTrackingRef(String trackingRef);

    Page<Parcel> findByClient_Id(UUID clientId, Pageable pageable);
}
