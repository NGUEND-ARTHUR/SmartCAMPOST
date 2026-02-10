package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.scan.OfflineSyncRequest;
import com.smartcampost.backend.dto.scan.OfflineSyncResponse;
import com.smartcampost.backend.service.ScanEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for offline sync operations.
 * Handles batch upload of scan events queued when device was offline.
 */
@RestController
@RequestMapping("/api/offline")
@RequiredArgsConstructor
public class OfflineSyncController {

    private final ScanEventService scanEventService;

    /**
     * Sync offline scan events.
     * Events are processed in order, preserving original timestamps.
     */
    @PostMapping("/sync")
    public ResponseEntity<OfflineSyncResponse> syncOfflineEvents(
            @Valid @RequestBody OfflineSyncRequest request
    ) {
        return ResponseEntity.ok(scanEventService.syncOfflineEvents(request));
    }
}
