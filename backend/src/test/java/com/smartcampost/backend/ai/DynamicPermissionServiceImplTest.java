package com.smartcampost.backend.ai;

import com.smartcampost.backend.repository.PermissionRepository;
import com.smartcampost.backend.repository.RolePermissionRepository;
import com.smartcampost.backend.service.impl.DynamicPermissionServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DynamicPermissionServiceImplTest {

    @Test
    void permissionsForRole_shouldFallbackToOperationalPermissionsWhenDatabaseIsEmpty() {
        RolePermissionRepository rolePermissionRepository = mock(RolePermissionRepository.class);
        PermissionRepository permissionRepository = mock(PermissionRepository.class);
        when(rolePermissionRepository.findByRoleNameIgnoreCaseAndEnabledTrue("ADMIN")).thenReturn(List.of());

        DynamicPermissionServiceImpl service = new DynamicPermissionServiceImpl(permissionRepository, rolePermissionRepository);

        assertThat(service.permissionsForRole("ADMIN"))
                .contains("parcel:read", "parcel:assign", "payment:verify", "approval:review", "rbac:manage", "ai:discover");
    }
}
