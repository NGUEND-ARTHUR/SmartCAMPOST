package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.pickup.PickupRequestCreateRequest;
import com.smartcampost.backend.dto.pickup.PickupRequestResponse;
import com.smartcampost.backend.service.PickupRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/pickups")
@RequiredArgsConstructor
public class PickupRequestController {

    private final PickupRequestService pickupRequestService;

    @PostMapping
    public ResponseEntity<PickupRequestResponse> createPickup(@Valid @RequestBody PickupRequestCreateRequest request) {
        return ResponseEntity.ok(pickupRequestService.createPickupRequest(request));
    }

    @GetMapping("/{pickupId}")
    public ResponseEntity<PickupRequestResponse> getPickup(@PathVariable UUID pickupId) {
        return ResponseEntity.ok(pickupRequestService.getPickupRequest(pickupId));
    }

    @PostMapping("/{pickupId}/assign-courier/{courierId}")
    public ResponseEntity<Void> assignCourier(@PathVariable UUID pickupId,
                                              @PathVariable UUID courierId) {
        pickupRequestService.assignCourier(pickupId, courierId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{pickupId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable UUID pickupId,
                                             @RequestParam String state) {
        pickupRequestService.updatePickupState(pickupId, state);
        return ResponseEntity.ok().build();
    }
}
