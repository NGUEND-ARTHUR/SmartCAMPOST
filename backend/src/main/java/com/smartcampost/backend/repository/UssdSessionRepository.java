package com.smartcampost.backend.repository;
import com.smartcampost.backend.model.UssdSession;
import com.smartcampost.backend.model.enums.UssdSessionState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UssdSessionRepository extends JpaRepository<UssdSession, UUID> {

    Optional<UssdSession> findTopBySessionRefAndStateOrderByLastInteractionAtDesc(
            String sessionRef,
            UssdSessionState state
    );
}