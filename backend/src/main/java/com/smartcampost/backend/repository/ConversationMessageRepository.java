package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.ConversationMessage;
import com.smartcampost.backend.model.enums.ConversationRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, UUID> {

    List<ConversationMessage> findByConversationIdOrderByTimestampAsc(UUID conversationId);

    Page<ConversationMessage> findByConversationId(UUID conversationId, Pageable pageable);

    List<ConversationMessage> findByConversationIdAndRole(UUID conversationId, ConversationRole role);

    List<ConversationMessage> findByDetectedIntent(String detectedIntent);

    @Query("SELECT SUM(m.tokenCount) FROM ConversationMessage m WHERE m.conversation.id = :conversationId")
    Long sumTokenCountByConversationId(@Param("conversationId") UUID conversationId);

    @Query("SELECT AVG(m.processingTimeMs) FROM ConversationMessage m WHERE m.conversation.id = :conversationId")
    Double avgProcessingTimeByConversationId(@Param("conversationId") UUID conversationId);

    long countByConversationId(UUID conversationId);

    List<ConversationMessage> findByTimestampBetween(Instant start, Instant end);
}
