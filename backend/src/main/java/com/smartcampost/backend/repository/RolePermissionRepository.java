package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {
    List<RolePermission> findByRoleNameIgnoreCaseAndEnabledTrue(String roleName);
    boolean existsByRoleNameIgnoreCaseAndPermissionCodeIgnoreCase(String roleName, String permissionCode);
}
