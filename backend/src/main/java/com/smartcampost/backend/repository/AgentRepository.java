package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Agent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AgentRepository extends JpaRepository <UUID, Agent> {

}
