package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.AiAgentRecommendation;
import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AiAgentRecommendationRepository extends JpaRepository<AiAgentRecommendation, UUID> {

    Optional<AiAgentRecommendation> findTopByModuleTypeAndSubjectTypeAndSubjectIdOrderByCreatedAtDesc(
            AiModuleType moduleType,
            AiSubjectType subjectType,
            UUID subjectId
    );

        Optional<AiAgentRecommendation> findTopBySubjectTypeAndSubjectIdOrderByCreatedAtDesc(
            AiSubjectType subjectType,
            UUID subjectId
        );

        Optional<AiAgentRecommendation> findTopByModuleTypeOrderByCreatedAtDesc(
            AiModuleType moduleType
        );
}
