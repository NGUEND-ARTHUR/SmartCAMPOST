package com.smartcampost.backend.controller;

import com.smartcampost.backend.service.DynamicPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rbac")
@RequiredArgsConstructor
public class RbacController {

    private final DynamicPermissionService dynamicPermissionService;

    @GetMapping("/roles/{roleName}/permissions")
    @PreAuthorize("hasAuthority('rbac:manage') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> permissions(@PathVariable String roleName) {
        return ResponseEntity.ok(Map.of(
                "role", roleName,
                "permissions", dynamicPermissionService.permissionsForRole(roleName)
        ));
    }

    @PostMapping("/roles/{roleName}/permissions")
    @PreAuthorize("hasAuthority('rbac:manage') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> grant(
            @PathVariable String roleName,
            @RequestBody Map<String, String> request
    ) {
        dynamicPermissionService.grantPermission(
                roleName,
                request.get("permission"),
                request.getOrDefault("description", "")
        );
        return permissions(roleName);
    }

    @DeleteMapping("/roles/{roleName}/permissions/{permission}")
    @PreAuthorize("hasAuthority('rbac:manage') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> revoke(
            @PathVariable String roleName,
            @PathVariable String permission
    ) {
        dynamicPermissionService.revokePermission(roleName, permission);
        return permissions(roleName);
    }
}
