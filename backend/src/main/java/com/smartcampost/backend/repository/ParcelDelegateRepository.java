package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.ParcelDelegate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParcelDelegateRepository extends JpaRepository<ParcelDelegate, UUID> {
    List<ParcelDelegate> findByParcelIdAndUsedFalse(UUID parcelId);
    Optional<ParcelDelegate> findByParcelIdAndPinCode(UUID parcelId, String pinCode);
    Optional<ParcelDelegate> findByParcelIdAndDelegatePhone(UUID parcelId, String delegatePhone);
}
