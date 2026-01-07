package com.smartcampost.backend.dto.admin;

import com.smartcampost.backend.model.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class UserAccountResponse {

    private UUID id;

    private String phone;

    private UserRole role;

    private UUID entityId;

    private Boolean frozen;

    private Instant createdAt;
}
