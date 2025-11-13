package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Staff;

import java.util.List;
import java.util.UUID;

public interface StaffService {

    Staff createStaff(Staff staff);

    Staff updateStaff(UUID staffId, Staff staff);

    void changeStaffStatus(UUID staffId, String newStatus); // Active / Inactive / Suspended

    List<Staff> listStaffByAgency(UUID agencyId);
}
