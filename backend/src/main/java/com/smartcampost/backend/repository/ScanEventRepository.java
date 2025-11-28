package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.ScanEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ScanEventRepository extends JpaRepository<ScanEvent, UUID> {

    // Historique chronologique pour un colis
    List<ScanEvent> findByParcel_IdOrderByTimestampAsc(UUID parcelId);
}
