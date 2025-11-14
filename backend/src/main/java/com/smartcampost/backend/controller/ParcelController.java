package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.parcel.ParcelCreateRequest;
import com.smartcampost.backend.dto.parcel.ParcelDetailResponse;
import com.smartcampost.backend.dto.parcel.ParcelSummaryResponse;
import com.smartcampost.backend.service.ParcelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/parcels")
@RequiredArgsConstructor
public class ParcelController {

    private final ParcelService parcelService;

    @PostMapping
    public ResponseEntity<ParcelDetailResponse> createParcel(@Valid @RequestBody ParcelCreateRequest request) {
        ParcelDetailResponse response = parcelService.createParcel(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{parcelId}")
    public ResponseEntity<ParcelDetailResponse> getParcel(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(parcelService.getParcel(parcelId));
    }

    @GetMapping("/tracking/{trackingRef}")
    public ResponseEntity<ParcelDetailResponse> getByTracking(@PathVariable String trackingRef) {
        return ResponseEntity.ok(parcelService.getByTrackingRef(trackingRef));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<ParcelSummaryResponse>> listByClient(@PathVariable UUID clientId) {
        return ResponseEntity.ok(parcelService.listClientParcels(clientId));
    }

    @PostMapping("/{parcelId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable UUID parcelId,
                                             @RequestParam String status) {
        parcelService.updateParcelStatus(parcelId, status);
        return ResponseEntity.ok().build();
    }
}
