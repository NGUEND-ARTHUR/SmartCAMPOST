package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.service.ScanEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/scan-events")
@RequiredArgsConstructor
public class ScanEventController {

    private final ScanEventService scanEventService;

    // US38 : ajouter un scan event
    @PostMapping
    public ResponseEntity<ScanEventResponse> recordScan(@Valid @RequestBody ScanEventCreateRequest request) {
        return ResponseEntity.ok(scanEventService.recordScanEvent(request));
    }

    // US39 : timeline d’un colis
    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<List<ScanEventResponse>> getHistory(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(scanEventService.getHistoryForParcel(parcelId));
    }
}
