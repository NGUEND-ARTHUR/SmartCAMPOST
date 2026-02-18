package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.AiAgentState;
import com.smartcampost.backend.model.enums.AiModuleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiAgentStateRepository extends JpaRepository<AiAgentState, UUID> {

    Optional<AiAgentState> findByModuleType(AiModuleType moduleType);

    List<AiAgentState> findByModuleTypeAndSubjectId(AiModuleType moduleType, UUID subjectId);

    Optional<AiAgentState> findByModuleTypeAndSubjectTypeAndSubjectId(
            AiModuleType moduleType, 
            com.smartcampost.backend.model.enums.AiSubjectType subjectType, 
            UUID subjectId);
}
