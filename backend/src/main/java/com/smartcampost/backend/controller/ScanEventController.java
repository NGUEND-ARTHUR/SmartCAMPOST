package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.service.ScanEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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

    @PostMapping("/bulk")
    public ResponseEntity<?> recordBulkScans(@RequestBody Object payload) {
        if (payload instanceof List<?> items) {
            List<ScanEventResponse> responses = new ArrayList<>();
            for (Object item : items) {
                if (item instanceof Map<?, ?> map) {
                    responses.add(scanEventService.recordScanEvent(toScanEventRequest(map)));
                }
            }
            return ResponseEntity.ok(responses);
        }

        if (payload instanceof Map<?, ?> map) {
            return ResponseEntity.ok(Map.of(
                    "status", "RECEIVED",
                    "bagId", defaultString(map.get("bagId")),
                    "eventType", defaultString(map.get("eventType")),
                    "trackingRefs", String.valueOf(map.get("trackingRefs"))
                            .lines()
                            .filter(line -> !line.isBlank())
                            .count()
            ));
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Unsupported bulk scan payload"));
    }

    // US39 : timeline d’un colis
    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<List<ScanEventResponse>> getHistory(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(scanEventService.getHistoryForParcel(parcelId));
    }

    private ScanEventCreateRequest toScanEventRequest(Map<?, ?> map) {
        ScanEventCreateRequest request = new ScanEventCreateRequest();
        request.setLocalId(stringValue(map.get("localId")));
        request.setParcelId(uuidValue(map.get("parcelId")));
        request.setAgencyId(uuidValue(map.get("agencyId")));
        request.setAgentId(uuidValue(map.get("agentId")));
        request.setEventType(stringValue(map.get("eventType")));
        request.setLatitude(doubleValue(map.get("latitude")));
        request.setLongitude(doubleValue(map.get("longitude")));
        String locationSource = stringValue(map.get("locationSource"));
        request.setLocationSource(locationSource == null || locationSource.isBlank() ? "GPS" : locationSource);
        request.setLocationNote(stringValue(map.get("locationNote")));
        request.setProofUrl(stringValue(map.get("proofUrl")));
        request.setComment(stringValue(map.get("comment")));
        request.setActorId(uuidValue(map.get("actorId")));
        request.setActorRole(stringValue(map.get("actorRole")));
        return request;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String defaultString(Object value) {
        String text = stringValue(value);
        return text == null ? "" : text;
    }

    private UUID uuidValue(Object value) {
        String text = stringValue(value);
        return text == null || text.isBlank() ? null : UUID.fromString(text);
    }

    private Double doubleValue(Object value) {
        String text = stringValue(value);
        return text == null || text.isBlank() ? null : Double.valueOf(text);
    }
}
