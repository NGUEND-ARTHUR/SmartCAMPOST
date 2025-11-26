package com.smartcampost.backend.dto.client;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateClientProfileRequest {

    // Tous les champs sont optionnels : on met à jour seulement ceux qui ne sont pas null

    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    private String preferredLanguage;
}
