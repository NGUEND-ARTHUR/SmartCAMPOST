package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.Notification;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByClient(Client client);

    List<Notification> findByParcel(Parcel parcel);

    List<Notification> findByStatus(NotificationStatus status);
}
