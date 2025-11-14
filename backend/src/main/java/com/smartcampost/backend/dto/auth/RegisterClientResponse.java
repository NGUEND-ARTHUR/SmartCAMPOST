package com.smartcampost.backend.dto.auth;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class RegisterClientResponse {
    private UUID clientId;
    private String fullName;
    private String phone;
    private String email;
    private String preferredLanguage;
}
