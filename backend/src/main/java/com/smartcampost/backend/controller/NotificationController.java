package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.notification.NotificationResponse;
import com.smartcampost.backend.dto.notification.TriggerNotificationRequest;
import com.smartcampost.backend.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.smartcampost.backend.dto.common.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // Admin déclenche une notif manuelle
    @PostMapping("/trigger")
    public ResponseEntity<NotificationResponse> trigger(@Valid @RequestBody TriggerNotificationRequest request) {
        return ResponseEntity.ok(notificationService.triggerNotification(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.getNotification(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<NotificationResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(notificationService.listNotifications(page, size));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<NotificationResponse> retry(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.retryNotification(id));
    }

    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<List<NotificationResponse>> listForParcel(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(notificationService.listForParcel(parcelId));
    }

    @GetMapping("/pickup/{pickupId}")
    public ResponseEntity<List<NotificationResponse>> listForPickup(@PathVariable UUID pickupId) {
        return ResponseEntity.ok(notificationService.listForPickup(pickupId));
    }
}
