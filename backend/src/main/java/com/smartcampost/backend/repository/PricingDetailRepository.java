package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PricingDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PricingDetailRepository extends JpaRepository<PricingDetail, UUID> {

    List<PricingDetail> findByParcelOrderByAppliedAtDesc(Parcel parcel);
}
