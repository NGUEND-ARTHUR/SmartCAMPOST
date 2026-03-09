package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByParcel_IdOrderByCreatedAtDesc(UUID parcelId);

    List<Notification> findByPickupRequest_IdOrderByCreatedAtDesc(UUID pickupId);

    Page<Notification> findByRecipientPhoneOrderByCreatedAtDesc(String phone, Pageable pageable);

    long countByRecipientPhoneAndReadAtIsNull(String phone);

    List<Notification> findByRecipientPhoneAndReadAtIsNull(String phone);
}
