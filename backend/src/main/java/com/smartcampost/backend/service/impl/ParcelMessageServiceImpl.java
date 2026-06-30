package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.message.ParcelMessageResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Agent;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.Courier;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.ParcelMessage;
import com.smartcampost.backend.model.Staff;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.ParcelMessageRepository;
import com.smartcampost.backend.repository.StaffRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.security.ParcelAuthorizationService;
import com.smartcampost.backend.service.ParcelMessageService;
import com.smartcampost.backend.sse.SseEmitters;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParcelMessageServiceImpl implements ParcelMessageService {

    private final ParcelMessageRepository parcelMessageRepository;
    private final ParcelAuthorizationService parcelAuthorizationService;
    private final UserAccountRepository userAccountRepository;
    private final ClientRepository clientRepository;
    private final CourierRepository courierRepository;
    private final StaffRepository staffRepository;
    private final AgentRepository agentRepository;
    private final SseEmitters sseEmitters;

    @Override
    public List<ParcelMessageResponse> listMessages(UUID parcelId, Authentication authentication) {
        parcelAuthorizationService.requireReadableParcel(parcelId, authentication);
        UserAccount actor = currentUser(authentication);
        return parcelMessageRepository.findByParcel_IdOrderByCreatedAtAsc(parcelId).stream()
                .map(m -> toResponse(m, actor))
                .toList();
    }

    @Override
    public ParcelMessageResponse sendMessage(UUID parcelId, String content, Authentication authentication) {
        Parcel parcel = parcelAuthorizationService.requireReadableParcel(parcelId, authentication);
        UserAccount actor = currentUser(authentication);

        ParcelMessage saved = parcelMessageRepository.save(ParcelMessage.builder()
                .parcel(parcel)
                .senderAccountId(actor.getId())
                .senderRole(actor.getRole())
                .senderName(resolveName(actor))
                .content(content.trim())
                .build());

        ParcelMessageResponse response = toResponse(saved, actor);
        sseEmitters.emitParcelMessage(parcelId, response);
        return response;
    }

    @Override
    public void markRead(UUID parcelId, Authentication authentication) {
        parcelAuthorizationService.requireReadableParcel(parcelId, authentication);
        UserAccount actor = currentUser(authentication);
        List<ParcelMessage> unread = parcelMessageRepository
                .findByParcel_IdAndSenderAccountIdNotAndReadByRecipientFalse(parcelId, actor.getId());
        unread.forEach(m -> m.setReadByRecipient(true));
        parcelMessageRepository.saveAll(unread);
    }

    @Override
    public long unreadCount(UUID parcelId, Authentication authentication) {
        parcelAuthorizationService.requireReadableParcel(parcelId, authentication);
        UserAccount actor = currentUser(authentication);
        return parcelMessageRepository
                .countByParcel_IdAndSenderAccountIdNotAndReadByRecipientFalse(parcelId, actor.getId());
    }

    private ParcelMessageResponse toResponse(ParcelMessage message, UserAccount actor) {
        return ParcelMessageResponse.builder()
                .id(message.getId())
                .parcelId(message.getParcel().getId())
                .senderAccountId(message.getSenderAccountId())
                .senderRole(message.getSenderRole().name())
                .senderName(message.getSenderName())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .mine(Objects.equals(message.getSenderAccountId(), actor.getId()))
                .read(message.isReadByRecipient())
                .build();
    }

    private String resolveName(UserAccount account) {
        UUID entityId = account.getEntityId();
        if (entityId == null) return account.getRole().name();
        return switch (account.getRole()) {
            case CLIENT -> clientRepository.findById(entityId).map(Client::getFullName).orElse("Client");
            case COURIER -> courierRepository.findById(entityId).map(Courier::getFullName).orElse("Courier");
            case AGENT -> agentRepository.findById(entityId).map(Agent::getFullName).orElse("Agent");
            default -> staffRepository.findById(entityId).map(Staff::getFullName).orElse(account.getRole().name());
        };
    }

    private UserAccount currentUser(Authentication authentication) {
        String subject = authentication.getName();
        try {
            UUID id = UUID.fromString(subject);
            return userAccountRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));
        } catch (IllegalArgumentException ex) {
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));
        }
    }
}
