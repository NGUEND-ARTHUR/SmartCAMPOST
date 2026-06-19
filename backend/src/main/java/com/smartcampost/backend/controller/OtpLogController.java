package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.common.PageResponse;
import com.smartcampost.backend.dto.notification.NotificationResponse;
import com.smartcampost.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
public class OtpLogController {

    private final NotificationService notificationService;

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','RISK')")
    public ResponseEntity<PageResponse<NotificationResponse>> listOtpLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(notificationService.listNotifications(page, size));
    }
}
