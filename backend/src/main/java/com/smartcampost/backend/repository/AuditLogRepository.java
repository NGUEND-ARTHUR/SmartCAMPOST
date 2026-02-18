package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.AuditLog;
import com.smartcampost.backend.model.enums.ActorType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findByActorId(String actorId);

    Page<AuditLog> findByActorId(String actorId, Pageable pageable);

    List<AuditLog> findByActorType(ActorType actorType);

    List<AuditLog> findByActionType(String actionType);

    List<AuditLog> findByEntityTypeAndEntityId(String entityType, UUID entityId);

    List<AuditLog> findByActorIdAndTimestampBetween(String actorId, Instant start, Instant end);

    Page<AuditLog> findByTimestampBetween(Instant start, Instant end, Pageable pageable);
}
