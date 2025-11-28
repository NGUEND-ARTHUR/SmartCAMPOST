package com.smartcampost.backend.repository;
import com.smartcampost.backend.model.IntegrationConfig;
import com.smartcampost.backend.model.enums.IntegrationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IntegrationConfigRepository extends JpaRepository<IntegrationConfig, UUID> {

    Optional<IntegrationConfig> findByTypeAndEnabledTrue(IntegrationType type);

    List<IntegrationConfig> findByEnabledTrue();
}