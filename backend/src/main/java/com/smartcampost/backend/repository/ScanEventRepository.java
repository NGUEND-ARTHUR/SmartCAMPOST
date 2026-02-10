package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.ScanEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ScanEventRepository extends JpaRepository<ScanEvent, UUID> {

    // Chronological history for a parcel
    List<ScanEvent> findByParcel_IdOrderByTimestampAsc(UUID parcelId);

    // Get last scan event for a parcel (current location)
    Optional<ScanEvent> findTopByParcel_IdOrderByTimestampDesc(UUID parcelId);

    // Audit: find by actor
    List<ScanEvent> findByActorIdOrderByTimestampDesc(String actorId);

    // Audit: find by agency
    List<ScanEvent> findByAgency_IdOrderByTimestampDesc(UUID agencyId);

    // Find unsynced events
    List<ScanEvent> findBySyncedFalseOrderByTimestampAsc();
}
