package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.admin.UserAccountResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserAccountRepository userAccountRepository;

    @Override
    public UserAccountResponse freezeAccount(UUID userId, boolean frozen) {
        Objects.requireNonNull(userId, "userId is required");
        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found", ErrorCode.USER_NOT_FOUND));

        account.setFrozen(frozen);
        var saved = userAccountRepository.save(account);
        if (saved == null) throw new IllegalStateException("failed to save user account");

        return toResponse(saved);
    }

    @Override
    public List<UserAccountResponse> listUsersByRole(UserRole role) {
        return userAccountRepository.findAllByRole(role).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<UserAccountResponse> listAllUsers() {
        return userAccountRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private UserAccountResponse toResponse(UserAccount a) {
        return UserAccountResponse.builder()
                .id(a.getId())
                .phone(a.getPhone())
                .role(a.getRole())
                .entityId(a.getEntityId())
                .frozen(a.isFrozen())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
