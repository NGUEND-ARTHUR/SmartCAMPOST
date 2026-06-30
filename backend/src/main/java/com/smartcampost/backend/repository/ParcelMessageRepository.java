package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.ParcelMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ParcelMessageRepository extends JpaRepository<ParcelMessage, UUID> {

    List<ParcelMessage> findByParcel_IdOrderByCreatedAtAsc(UUID parcelId);

    long countByParcel_IdAndSenderAccountIdNotAndReadByRecipientFalse(UUID parcelId, UUID senderAccountId);

    List<ParcelMessage> findByParcel_IdAndSenderAccountIdNotAndReadByRecipientFalse(UUID parcelId, UUID senderAccountId);
}
