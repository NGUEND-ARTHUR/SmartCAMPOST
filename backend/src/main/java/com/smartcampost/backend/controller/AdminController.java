package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.admin.FreezeAccountRequest;
import com.smartcampost.backend.dto.admin.UserAccountResponse;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ✅ List all users (admin overview)
    @GetMapping("/users")
    public ResponseEntity<List<UserAccountResponse>> listAllUsers() {
        return ResponseEntity.ok(adminService.listAllUsers());
    }

    // ✅ Filter by role (ADMIN/FINANCE/RISK/STAFF/CLIENT etc)
    @GetMapping("/users/by-role")
    public ResponseEntity<List<UserAccountResponse>> listUsersByRole(@RequestParam("role") UserRole role) {
        return ResponseEntity.ok(adminService.listUsersByRole(role));
    }

    // ✅ Freeze/unfreeze account
    @PatchMapping("/users/{userId}/freeze")
    public ResponseEntity<UserAccountResponse> freezeUser(
            @PathVariable UUID userId,
            @Valid @RequestBody FreezeAccountRequest request
    ) {
        return ResponseEntity.ok(adminService.freezeAccount(userId, request.getFrozen()));
    }
}
