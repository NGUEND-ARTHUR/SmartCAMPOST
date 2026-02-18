package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.AiDecisionLog;
import com.smartcampost.backend.model.enums.AiModuleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AiDecisionLogRepository extends JpaRepository<AiDecisionLog, UUID> {

    List<AiDecisionLog> findByModuleType(AiModuleType moduleType);

    Page<AiDecisionLog> findByModuleType(AiModuleType moduleType, Pageable pageable);

    List<AiDecisionLog> findByDecisionType(String decisionType);

    List<AiDecisionLog> findByDecisionOutcome(String decisionOutcome);

    List<AiDecisionLog> findByModuleTypeAndCreatedAtBetween(AiModuleType moduleType, Instant start, Instant end);

    List<AiDecisionLog> findBySubjectId(UUID subjectId);

    long countByModuleTypeAndDecisionOutcome(AiModuleType moduleType, String decisionOutcome);
}
