package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.SystemEvent;
import com.smartcampost.backend.model.enums.EventCategory;
import com.smartcampost.backend.model.enums.EventProcessingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface SystemEventRepository extends JpaRepository<SystemEvent, UUID> {

    List<SystemEvent> findByEventCategory(EventCategory eventCategory);

    Page<SystemEvent> findByEventCategory(EventCategory eventCategory, Pageable pageable);

    List<SystemEvent> findByEventType(String eventType);

    List<SystemEvent> findByProcessingStatus(EventProcessingStatus status);

    List<SystemEvent> findByProcessingStatusAndRetryCountLessThan(EventProcessingStatus status, int maxRetries);

    List<SystemEvent> findByEntityId(UUID entityId);

    List<SystemEvent> findByEventCategoryAndCreatedAtBetween(EventCategory eventCategory, Instant start, Instant end);

    long countByProcessingStatus(EventProcessingStatus status);
}
