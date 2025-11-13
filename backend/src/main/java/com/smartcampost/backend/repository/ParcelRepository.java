package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ParcelRepository extends JpaRepository<Parcel, UUID> {

    Optional<Parcel> findByTrackingRef(String trackingRef);

    List<Parcel> findByClient(Client client);

    List<Parcel> findByStatus(ParcelStatus status);
}
