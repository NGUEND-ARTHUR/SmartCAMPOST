package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.notification.NotificationResponse;
import com.smartcampost.backend.dto.notification.NotificationSendRequest;
import com.smartcampost.backend.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> sendNotification(
            @Valid @RequestBody NotificationSendRequest request) {
        return ResponseEntity.ok(notificationService.sendNotification(request));
    }

    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<List<NotificationResponse>> listByParcel(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(notificationService.listByParcel(parcelId));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<NotificationResponse>> listByClient(@PathVariable UUID clientId) {
        return ResponseEntity.ok(notificationService.listByClient(clientId));
    }
}
