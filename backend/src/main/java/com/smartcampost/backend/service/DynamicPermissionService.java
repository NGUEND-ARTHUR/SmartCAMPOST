package com.smartcampost.backend.service;

import java.util.Set;

public interface DynamicPermissionService {
    Set<String> permissionsForRole(String roleName);
    Set<String> defaultPermissionsForRole(String roleName);
    void grantPermission(String roleName, String permissionCode, String description);
    void revokePermission(String roleName, String permissionCode);
}
