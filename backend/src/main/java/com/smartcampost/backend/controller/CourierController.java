package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.courier.*;
import com.smartcampost.backend.service.CourierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/couriers")
@RequiredArgsConstructor
public class CourierController {

    private final CourierService courierService;

    // US17: Admin registers couriers
    @PostMapping
    public ResponseEntity<CourierResponse> createCourier(
            @Valid @RequestBody CreateCourierRequest request
    ) {
        return ResponseEntity.ok(courierService.createCourier(request));
    }

    // Get by ID
    @GetMapping("/{courierId}")
    public ResponseEntity<CourierResponse> getCourierById(
            @PathVariable UUID courierId
    ) {
        return ResponseEntity.ok(courierService.getCourierById(courierId));
    }

    // List paginated
    @GetMapping
    public ResponseEntity<Page<CourierResponse>> listCouriers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(courierService.listCouriers(page, size));
    }

    // US19: update status
    @PatchMapping("/{courierId}/status")
    public ResponseEntity<CourierResponse> updateCourierStatus(
            @PathVariable UUID courierId,
            @Valid @RequestBody UpdateCourierStatusRequest request
    ) {
        return ResponseEntity.ok(courierService.updateCourierStatus(courierId, request));
    }

    // US18: update vehicle identifier
    @PatchMapping("/{courierId}/vehicle")
    public ResponseEntity<CourierResponse> updateCourierVehicle(
            @PathVariable UUID courierId,
            @Valid @RequestBody UpdateCourierVehicleRequest request
    ) {
        return ResponseEntity.ok(courierService.updateCourierVehicle(courierId, request));
    }
}
