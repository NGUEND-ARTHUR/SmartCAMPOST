package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.message.ParcelMessageResponse;
import com.smartcampost.backend.dto.message.SendParcelMessageRequest;
import com.smartcampost.backend.service.ParcelMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/parcels/{parcelId}/messages")
@RequiredArgsConstructor
public class ParcelMessageController {

    private final ParcelMessageService parcelMessageService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ParcelMessageResponse>> list(
            @PathVariable UUID parcelId, Authentication authentication) {
        return ResponseEntity.ok(parcelMessageService.listMessages(parcelId, authentication));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ParcelMessageResponse> send(
            @PathVariable UUID parcelId,
            @Valid @RequestBody SendParcelMessageRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                parcelMessageService.sendMessage(parcelId, request.getContent(), authentication));
    }

    @PostMapping("/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markRead(@PathVariable UUID parcelId, Authentication authentication) {
        parcelMessageService.markRead(parcelId, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @PathVariable UUID parcelId, Authentication authentication) {
        return ResponseEntity.ok(Map.of("count", parcelMessageService.unreadCount(parcelId, authentication)));
    }
}
