package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.staff.*;
import com.smartcampost.backend.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    // US14: Admin crée un staff
    @PostMapping
    public ResponseEntity<StaffResponse> createStaff(
            @Valid @RequestBody CreateStaffRequest request
    ) {
        return ResponseEntity.ok(staffService.createStaff(request));
    }

    // US15 / US16 : consulter un staff
    @GetMapping("/{staffId}")
    public ResponseEntity<StaffResponse> getStaffById(
            @PathVariable UUID staffId
    ) {
        return ResponseEntity.ok(staffService.getStaffById(staffId));
    }

    // Liste paginée du staff
    @GetMapping
    public ResponseEntity<Page<StaffResponse>> listStaff(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(staffService.listStaff(page, size));
    }

    // Modifier le statut (ACTIVE / INACTIVE / SUSPENDED)
    @PatchMapping("/{staffId}/status")
    public ResponseEntity<StaffResponse> updateStaffStatus(
            @PathVariable UUID staffId,
            @Valid @RequestBody UpdateStaffStatusRequest request
    ) {
        return ResponseEntity.ok(staffService.updateStaffStatus(staffId, request));
    }

    // Modifier le rôle (ADMIN, MANAGER, etc.)
    @PatchMapping("/{staffId}/role")
    public ResponseEntity<StaffResponse> updateStaffRole(
            @PathVariable UUID staffId,
            @Valid @RequestBody UpdateStaffRoleRequest request
    ) {
        return ResponseEntity.ok(staffService.updateStaffRole(staffId, request));
    }
}
