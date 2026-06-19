package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.model.Permission;
import com.smartcampost.backend.model.RolePermission;
import com.smartcampost.backend.repository.PermissionRepository;
import com.smartcampost.backend.repository.RolePermissionRepository;
import com.smartcampost.backend.service.DynamicPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DynamicPermissionServiceImpl implements DynamicPermissionService {

    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    public Set<String> permissionsForRole(String roleName) {
        if (roleName == null || roleName.isBlank()) return Set.of();
        Set<String> dbPermissions = rolePermissionRepository
                .findByRoleNameIgnoreCaseAndEnabledTrue(normalizeRole(roleName))
                .stream()
                .map(RolePermission::getPermissionCode)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (!dbPermissions.isEmpty()) return dbPermissions;
        return defaultPermissionsForRole(roleName);
    }

    @Override
    public Set<String> defaultPermissionsForRole(String roleName) {
        String role = normalizeRole(roleName);
        Set<String> common = new LinkedHashSet<>(Set.of("parcel:read", "notification:send"));
        return switch (role) {
            case "ADMIN" -> union(common, Set.of(
                    "parcel:assign", "courier:read", "delivery:write", "payment:read", "payment:verify",
                    "report:read", "risk:write", "approval:review", "rbac:manage", "ai:operate", "ai:discover"
            ));
            case "STAFF" -> union(common, Set.of(
                    "parcel:assign", "courier:read", "delivery:write", "payment:read",
                    "report:read", "approval:review", "ai:operate", "ai:discover"
            ));
            case "FINANCE" -> union(common, Set.of("payment:read", "payment:verify", "report:read", "ai:operate"));
            case "RISK" -> union(common, Set.of("payment:read", "payment:verify", "risk:write", "report:read", "ai:operate", "ai:discover"));
            case "COURIER", "AGENT" -> union(common, Set.of("delivery:write", "courier:read", "ai:operate"));
            case "CLIENT" -> union(common, Set.of("payment:read"));
            default -> common;
        };
    }

    @Override
    @Transactional
    public void grantPermission(String roleName, String permissionCode, String description) {
        String role = normalizeRole(roleName);
        String permission = normalizePermission(permissionCode);
        if (!permissionRepository.existsByCode(permission)) {
            permissionRepository.save(Permission.builder().code(permission).description(description).build());
        }
        if (!rolePermissionRepository.existsByRoleNameIgnoreCaseAndPermissionCodeIgnoreCase(role, permission)) {
            rolePermissionRepository.save(RolePermission.builder()
                    .roleName(role)
                    .permissionCode(permission)
                    .enabled(true)
                    .build());
        }
    }

    @Override
    @Transactional
    public void revokePermission(String roleName, String permissionCode) {
        String role = normalizeRole(roleName);
        String permission = normalizePermission(permissionCode);
        rolePermissionRepository.findByRoleNameIgnoreCaseAndEnabledTrue(role)
                .stream()
                .filter(item -> item.getPermissionCode().equalsIgnoreCase(permission))
                .forEach(item -> {
                    item.setEnabled(false);
                    rolePermissionRepository.save(item);
                });
    }

    private String normalizeRole(String roleName) {
        return roleName.replaceFirst("^ROLE_", "").trim().toUpperCase(Locale.ROOT);
    }

    private String normalizePermission(String permissionCode) {
        return permissionCode.trim().toLowerCase(Locale.ROOT);
    }

    private Set<String> union(Set<String> left, Set<String> right) {
        Set<String> result = new LinkedHashSet<>(left);
        result.addAll(right);
        return result;
    }
}
