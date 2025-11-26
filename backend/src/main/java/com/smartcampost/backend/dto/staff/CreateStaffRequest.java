package com.smartcampost.backend.dto.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaffRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    private String role; // e.g. "ADMIN", "MANAGER"

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String phone;

    @NotBlank
    private String password;

    // optionnel : date d'embauche
    private LocalDate hiredAt;
}
