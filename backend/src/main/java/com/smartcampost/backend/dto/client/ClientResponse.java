package com.smartcampost.backend.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO renvoyé au frontend quand on expose un client.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientResponse {

    private UUID id;
    private String fullName;
    private String phone;
    private String email;
    private String preferredLanguage;
}
