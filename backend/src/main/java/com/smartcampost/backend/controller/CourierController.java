package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.courier.*;
import com.smartcampost.backend.model.Courier;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.CourierStatus;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.CourierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/couriers")
@RequiredArgsConstructor
public class CourierController {

    private final CourierService courierService;
    private final CourierRepository courierRepository;
    private final UserAccountRepository userAccountRepository;

    // US17: Admin registers couriers (ADMIN only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
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

    // US19: update status (ADMIN or STAFF)
    @PatchMapping("/{courierId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<CourierResponse> updateCourierStatus(
            @PathVariable UUID courierId,
            @Valid @RequestBody UpdateCourierStatusRequest request
    ) {
        return ResponseEntity.ok(courierService.updateCourierStatus(courierId, request));
    }

    // US18: update vehicle identifier (ADMIN or STAFF)
    @PatchMapping("/{courierId}/vehicle")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<CourierResponse> updateCourierVehicle(
            @PathVariable UUID courierId,
            @Valid @RequestBody UpdateCourierVehicleRequest request
    ) {
        return ResponseEntity.ok(courierService.updateCourierVehicle(courierId, request));
    }

    /**
     * Courier toggles their own duty status (on-shift / off-shift).
     * ON_DUTY = AVAILABLE, OFF_DUTY = OFFLINE.
     * When OFF_DUTY, the mobile app stops sending GPS location updates.
     */
    @PostMapping("/me/duty")
    @PreAuthorize("hasAnyRole('COURIER','AGENT')")
    public ResponseEntity<Map<String, Object>> toggleDuty(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        boolean onDuty = Boolean.TRUE.equals(body.get("onDuty"));
        Optional<Courier> courierOpt = resolveCurrentCourier(authentication);

        if (courierOpt.isPresent()) {
            Courier courier = courierOpt.get();
            courier.setStatus(onDuty ? CourierStatus.AVAILABLE : CourierStatus.OFFLINE);
            courierRepository.save(courier);
        }

        return ResponseEntity.ok(Map.of(
                "onDuty", onDuty,
                "status", onDuty ? "AVAILABLE" : "OFFLINE"
        ));
    }

    @GetMapping("/me/duty")
    @PreAuthorize("hasAnyRole('COURIER','AGENT')")
    public ResponseEntity<Map<String, Object>> getDutyStatus(Authentication authentication) {
        Optional<Courier> courierOpt = resolveCurrentCourier(authentication);
        boolean onDuty = courierOpt.map(c -> c.getStatus() != CourierStatus.OFFLINE && c.getStatus() != CourierStatus.INACTIVE).orElse(false);
        return ResponseEntity.ok(Map.of("onDuty", onDuty));
    }

    private Optional<Courier> resolveCurrentCourier(Authentication authentication) {
        String subject = authentication.getName();

        // 1) Try phone lookup
        Optional<Courier> courierOpt = courierRepository.findByPhone(subject);
        if (courierOpt.isPresent()) return courierOpt;

        // 2) Try as UserAccount ID → entityId → Courier
        try {
            UUID userAccountId = UUID.fromString(subject);
            Optional<UserAccount> userOpt = userAccountRepository.findById(userAccountId);
            if (userOpt.isPresent() && userOpt.get().getEntityId() != null) {
                courierOpt = courierRepository.findById(userOpt.get().getEntityId());
                if (courierOpt.isPresent()) return courierOpt;
            }
            // 3) Fallback: maybe subject IS the courier ID directly
            courierOpt = courierRepository.findById(userAccountId);
            if (courierOpt.isPresent()) return courierOpt;
        } catch (IllegalArgumentException ignored) {}

        return Optional.empty();
    }
}
