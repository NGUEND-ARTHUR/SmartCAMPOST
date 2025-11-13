package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.DeliveryProof;
import com.smartcampost.backend.model.Parcel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DeliveryProofRepository extends JpaRepository<DeliveryProof, UUID> {

    Optional<DeliveryProof> findByParcel(Parcel parcel);
}
