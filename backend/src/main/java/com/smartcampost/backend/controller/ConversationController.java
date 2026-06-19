package com.smartcampost.backend.controller;

import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.model.Conversation;
import com.smartcampost.backend.model.ConversationMessage;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.ConversationChannel;
import com.smartcampost.backend.model.enums.ConversationRole;
import com.smartcampost.backend.model.enums.ConversationStatus;
import com.smartcampost.backend.repository.ConversationMessageRepository;
import com.smartcampost.backend.repository.ConversationRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final ConversationMessageRepository messageRepository;
    private final UserAccountRepository userAccountRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Conversation>> mine() {
        UserAccount actor = currentUser();
        return ResponseEntity.ok(conversationRepository.findByUserId(actor.getId()));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> start(@RequestBody Map<String, Object> request) {
        UserAccount actor = currentUser();
        ConversationChannel channel = ConversationChannel.valueOf(
                stringValue(request.get("channel"), "WEB").toUpperCase()
        );
        Conversation conversation = conversationRepository.save(Conversation.builder()
                .userId(actor.getId())
                .userType(actor.getRole())
                .channel(channel)
                .status(ConversationStatus.ACTIVE)
                .contextData(stringValue(request.get("contextData"), null))
                .lastMessageAt(Instant.now())
                .build());
        String message = stringValue(request.get("message"), null);
        if (message != null && !message.isBlank()) {
            messageRepository.save(ConversationMessage.builder()
                    .conversation(conversation)
                    .role(ConversationRole.USER)
                    .content(message)
                    .build());
        }
        return ResponseEntity.ok(Map.of(
                "conversationId", conversation.getId(),
                "status", conversation.getStatus().name(),
                "channel", conversation.getChannel().name()
        ));
    }

    @GetMapping("/{conversationId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ConversationMessage>> messages(@PathVariable UUID conversationId) {
        UserAccount actor = currentUser();
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AuthException(ErrorCode.BUSINESS_ERROR, "Conversation not found"));
        if (!conversation.getUserId().equals(actor.getId()) && actor.getRole() != com.smartcampost.backend.model.enums.UserRole.ADMIN) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Conversation access denied");
        }
        return ResponseEntity.ok(messageRepository.findByConversationIdOrderByTimestampAsc(conversationId));
    }

    @PostMapping("/{conversationId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> sendMessage(@PathVariable UUID conversationId, @RequestBody Map<String, Object> request) {
        UserAccount actor = currentUser();
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AuthException(ErrorCode.BUSINESS_ERROR, "Conversation not found"));
        if (!conversation.getUserId().equals(actor.getId()) && actor.getRole() != com.smartcampost.backend.model.enums.UserRole.ADMIN) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Conversation access denied");
        }
        String content = stringValue(request.get("message"), "");
        ConversationMessage saved = messageRepository.save(ConversationMessage.builder()
                .conversation(conversation)
                .role(ConversationRole.USER)
                .content(content)
                .build());
        conversation.setLastMessageAt(Instant.now());
        conversationRepository.save(conversation);
        return ResponseEntity.ok(Map.of(
                "messageId", saved.getId(),
                "conversationId", conversation.getId(),
                "timestamp", saved.getTimestamp(),
                "status", "SENT"
        ));
    }

    private UserAccount currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Not authenticated");
        }
        String principal = auth.getName();
        return userAccountRepository.findByPhone(principal)
                .or(() -> {
                    try {
                        return userAccountRepository.findById(UUID.fromString(principal));
                    } catch (IllegalArgumentException ex) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseThrow(() -> new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "User not found"));
    }

    private static String stringValue(Object value, String fallback) {
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }
}
