package com.smartcampost.backend.dto.agent;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateAgentRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String staffNumber;

    @NotBlank(message = "Phone is required")
    private String phone;

    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private UUID agencyId;
}
