package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.PricingDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PricingDetailRepository extends JpaRepository<PricingDetail, UUID> {

    boolean existsByParcel_Id(UUID parcelId);

    List<PricingDetail> findByParcel_IdOrderByAppliedAtAsc(UUID parcelId);

    Optional<PricingDetail> findTopByParcel_IdOrderByAppliedAtDesc(UUID parcelId);

    Page<PricingDetail> findByParcel_Id(UUID parcelId, Pageable pageable);
}
