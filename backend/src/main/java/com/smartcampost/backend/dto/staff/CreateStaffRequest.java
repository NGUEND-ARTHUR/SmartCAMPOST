package com.smartcampost.backend.dto.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaffRequest {

    @NotBlank
    private String fullName;

    /**
     * ✅ Keep String (no enum) to respect your architecture.
     * ✅ Restrict to STAFF-like roles used by your access control.
     */
    @NotBlank
    @Pattern(
            regexp = "^(STAFF|ADMIN|FINANCE|RISK)$",
            message = "role must be one of: STAFF, ADMIN, FINANCE, RISK"
    )
    private String role; // e.g. "ADMIN", "FINANCE", "RISK", "STAFF"

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
