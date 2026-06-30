package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.message.ParcelMessageResponse;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

public interface ParcelMessageService {

    List<ParcelMessageResponse> listMessages(UUID parcelId, Authentication authentication);

    ParcelMessageResponse sendMessage(UUID parcelId, String content, Authentication authentication);

    void markRead(UUID parcelId, Authentication authentication);

    long unreadCount(UUID parcelId, Authentication authentication);
}
