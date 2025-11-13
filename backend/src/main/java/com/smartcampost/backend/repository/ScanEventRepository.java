package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.ScanEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ScanEventRepository extends JpaRepository<ScanEvent, UUID> {

    List<ScanEvent> findByParcelOrderByEventTimeAsc(Parcel parcel);
}
