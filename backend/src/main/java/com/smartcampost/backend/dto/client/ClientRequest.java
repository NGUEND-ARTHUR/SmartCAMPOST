package com.smartcampost.backend.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO utilisé pour créer / mettre à jour un client.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientRequest {

    private String fullName;
    private String phone;
    private String email;
    private String preferredLanguage; // "FR", "EN", etc.
}
