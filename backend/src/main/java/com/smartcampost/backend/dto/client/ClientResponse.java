package com.smartcampost.backend.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientResponse {

    private UUID id;
    private String fullName;
    private String phone;
    private String email;
    private String preferredLanguage;
    private Instant createdAt;
}
