package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Conversation;
import com.smartcampost.backend.model.enums.ConversationChannel;
import com.smartcampost.backend.model.enums.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    List<Conversation> findByUserId(UUID userId);

    Page<Conversation> findByUserId(UUID userId, Pageable pageable);

    List<Conversation> findByUserIdAndStatus(UUID userId, ConversationStatus status);

    List<Conversation> findByChannel(ConversationChannel channel);

    List<Conversation> findByStatus(ConversationStatus status);

    List<Conversation> findByUserIdAndStartedAtBetween(UUID userId, Instant start, Instant end);

    long countByChannelAndStartedAtBetween(ConversationChannel channel, Instant start, Instant end);
}
