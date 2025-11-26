package com.smartcampost.backend.dto.staff;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStaffRoleRequest {

    @NotBlank
    private String role; // e.g. "ADMIN", "MANAGER"
}
