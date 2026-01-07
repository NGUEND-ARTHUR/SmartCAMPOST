package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.admin.UserAccountResponse;
import com.smartcampost.backend.model.enums.UserRole;

import java.util.List;
import java.util.UUID;

public interface AdminService {
    UserAccountResponse freezeAccount(UUID userId, boolean frozen);
    List<UserAccountResponse> listUsersByRole(UserRole role);
    List<UserAccountResponse> listAllUsers();
}
