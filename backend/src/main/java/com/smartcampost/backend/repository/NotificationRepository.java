package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByParcel_Id(UUID parcelId);

    List<Notification> findByClient_Id(UUID clientId);
}
