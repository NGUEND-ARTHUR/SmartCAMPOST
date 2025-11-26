package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Agent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AgentRepository extends JpaRepository<Agent, UUID> {

    boolean existsByStaffNumber(String staffNumber);

    boolean existsByPhone(String phone);

    Optional<Agent> findByPhone(String phone);
}
