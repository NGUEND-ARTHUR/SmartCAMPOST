package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByParcel_IdOrderByCreatedAtDesc(UUID parcelId);

    List<Notification> findByPickupRequest_IdOrderByCreatedAtDesc(UUID pickupId);

    Page<Notification> findByRecipientPhoneOrderByCreatedAtDesc(String phone, Pageable pageable);

    long countByRecipientPhoneAndReadAtIsNull(String phone);

    List<Notification> findByRecipientPhoneAndReadAtIsNull(String phone);

    /** Finds notifications for a client by phone OR by the parcel's client entity ID (handles phone-format mismatches). */
    @Query("SELECT DISTINCT n FROM Notification n WHERE n.recipientPhone = :phone " +
           "OR (n.parcel IS NOT NULL AND n.parcel.client.id = :clientId) " +
           "ORDER BY n.createdAt DESC")
    Page<Notification> findByPhoneOrClientId(
            @Param("phone") String phone,
            @Param("clientId") UUID clientId,
            Pageable pageable);

    @Query("SELECT COUNT(DISTINCT n) FROM Notification n WHERE " +
           "(n.recipientPhone = :phone OR (n.parcel IS NOT NULL AND n.parcel.client.id = :clientId)) " +
           "AND n.readAt IS NULL")
    long countUnreadByPhoneOrClientId(
            @Param("phone") String phone,
            @Param("clientId") UUID clientId);

    @Query("SELECT n FROM Notification n WHERE " +
           "(n.recipientPhone = :phone OR (n.parcel IS NOT NULL AND n.parcel.client.id = :clientId)) " +
           "AND n.readAt IS NULL")
    List<Notification> findUnreadByPhoneOrClientId(
            @Param("phone") String phone,
            @Param("clientId") UUID clientId);
}
