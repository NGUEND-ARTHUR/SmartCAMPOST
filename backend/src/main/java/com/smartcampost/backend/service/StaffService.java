package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.staff.*;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface StaffService {

    StaffResponse createStaff(CreateStaffRequest request);

    StaffResponse getStaffById(UUID staffId);

    Page<StaffResponse> listStaff(int page, int size);

    StaffResponse updateStaffStatus(UUID staffId, UpdateStaffStatusRequest request);

    StaffResponse updateStaffRole(UUID staffId, UpdateStaffRoleRequest request);
}
