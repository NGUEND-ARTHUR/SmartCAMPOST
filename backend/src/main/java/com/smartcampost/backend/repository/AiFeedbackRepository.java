package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.AiFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiFeedbackRepository extends JpaRepository<AiFeedback, UUID> {
    List<AiFeedback> findBySessionId(String sessionId);
    List<AiFeedback> findByUserId(UUID userId);
}
