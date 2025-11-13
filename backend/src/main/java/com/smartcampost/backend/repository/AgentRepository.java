package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Agent;
import com.smartcampost.backend.model.Agency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentRepository extends JpaRepository<Agent, UUID> {

    Optional<Agent> findByStaffNumber(String staffNumber);

    List<Agent> findByAgency(Agency agency);
}
