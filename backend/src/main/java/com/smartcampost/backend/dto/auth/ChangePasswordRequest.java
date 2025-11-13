package com.smartcampost.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    private UUID userId;        // or you can ignore this and use the authenticated user
    private String oldPassword;
    private String newPassword;
}
