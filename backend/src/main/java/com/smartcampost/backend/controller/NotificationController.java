package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.notification.NotificationResponse;
import com.smartcampost.backend.dto.notification.TriggerNotificationRequest;
import com.smartcampost.backend.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.smartcampost.backend.dto.common.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    // Admin déclenche une notif manuelle
    @PostMapping("/trigger")
    @PreAuthorize("isAuthenticated() and !hasAnyRole('CLIENT','COURIER')")
    public ResponseEntity<NotificationResponse> trigger(@Valid @RequestBody TriggerNotificationRequest request) {
        return ResponseEntity.ok(notificationService.triggerNotification(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.getNotification(id));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated() and !hasAnyRole('CLIENT','COURIER')")
    public ResponseEntity<PageResponse<NotificationResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(notificationService.listNotifications(page, size));
    }

    @GetMapping("/templates")
    @PreAuthorize("isAuthenticated() and !hasAnyRole('CLIENT','COURIER')")
    public ResponseEntity<List<Map<String, Object>>> listTemplates() {
        return ResponseEntity.ok(List.of(
                Map.of(
                        "code", "PARCEL_CREATED",
                        "channel", "SMS_EMAIL",
                        "language", "FR_EN",
                        "subject", "Parcel registration confirmation",
                        "status", "ACTIVE",
                        "updatedAt", Instant.now()
                ),
                Map.of(
                        "code", "OUT_FOR_DELIVERY",
                        "channel", "SMS",
                        "language", "FR_EN",
                        "subject", "Delivery OTP notification",
                        "status", "ACTIVE",
                        "updatedAt", Instant.now()
                ),
                Map.of(
                        "code", "PICKUP_READY",
                        "channel", "SMS_EMAIL",
                        "language", "FR_EN",
                        "subject", "Agency pickup ready",
                        "status", "ACTIVE",
                        "updatedAt", Instant.now()
                )
        ));
    }

    @GetMapping("/otp/logs")
    @PreAuthorize("isAuthenticated() and !hasAnyRole('CLIENT','COURIER')")
    public ResponseEntity<PageResponse<NotificationResponse>> listOtpLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(notificationService.listNotifications(page, size));
    }

    @PostMapping("/{id}/retry")
    @PreAuthorize("isAuthenticated() and !hasAnyRole('CLIENT','COURIER')")
    public ResponseEntity<NotificationResponse> retry(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.retryNotification(id));
    }

    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<List<NotificationResponse>> listForParcel(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(notificationService.listForParcel(parcelId));
    }

    @GetMapping("/me")
    public ResponseEntity<PageResponse<NotificationResponse>> listMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(notificationService.listMyNotifications(page, size));
    }

    @GetMapping("/pickup/{pickupId}")
    public ResponseEntity<List<NotificationResponse>> listForPickup(@PathVariable UUID pickupId) {
        return ResponseEntity.ok(notificationService.listForPickup(pickupId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }
}
