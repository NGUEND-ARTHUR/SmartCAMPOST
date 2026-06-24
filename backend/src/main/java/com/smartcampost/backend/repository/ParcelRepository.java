package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
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

    // ✅ FIX: Paginated version for map endpoints - prevents memory bomb
    Page<Parcel> findByStatusIn(List<ParcelStatus> statuses, Pageable pageable);

    // ✅ FIX: COUNT query for dashboard - avoids findAll() memory bomb
    long countByStatus(ParcelStatus status);

    // ✅ FIX: Use this in DashboardServiceImpl instead of findAll().stream().filter(DELIVERED)
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Parcel p WHERE p.status IN :statuses")
    long countByStatusIn(@org.springframework.data.repository.query.Param("statuses") List<ParcelStatus> statuses);

    // ✅ FIX: Count parcels by destination agency for ReportingService zone volume
    long countByDestinationAgency_Id(UUID agencyId);

    // Single aggregation query: returns [city, count] pairs — avoids N+1 in ReportingService
    @org.springframework.data.jpa.repository.Query(
        "SELECT a.city, COUNT(p) FROM Parcel p JOIN p.destinationAgency a GROUP BY a.city ORDER BY COUNT(p) DESC"
    )
    List<Object[]> countParcelsByDestinationAgencyCity();

    // Find unlocked parcels (can be corrected)
    List<Parcel> findByLockedFalse();

    // Used to block deleting an address that's still referenced by a parcel
    boolean existsBySenderAddress_IdOrRecipientAddress_Id(UUID senderAddressId, UUID recipientAddressId);

    // ✅ FIX: DB-level date filter for demand forecasting — avoids findAll() memory bomb
    List<Parcel> findByCreatedAtAfter(Instant createdAt);

    // Real route-optimization data: per-destination-city load and how many are overdue
    @Query("SELECT da.city, COUNT(p), SUM(CASE WHEN p.expectedDeliveryAt < :now THEN 1 ELSE 0 END) " +
            "FROM Parcel p JOIN p.destinationAgency da WHERE p.status IN :statuses " +
            "GROUP BY da.city ORDER BY COUNT(p) DESC")
    List<Object[]> destinationCityLoadAndOverdue(@Param("statuses") List<ParcelStatus> statuses, @Param("now") Instant now);

    // Real route-optimization data: per-corridor (origin city -> destination city) load and overdue count
    @Query("SELECT oa.city, da.city, COUNT(p), SUM(CASE WHEN p.expectedDeliveryAt < :now THEN 1 ELSE 0 END) " +
            "FROM Parcel p JOIN p.originAgency oa JOIN p.destinationAgency da WHERE p.status IN :statuses " +
            "GROUP BY oa.city, da.city ORDER BY COUNT(p) DESC")
    List<Object[]> corridorLoadAndOverdue(@Param("statuses") List<ParcelStatus> statuses, @Param("now") Instant now);
}
