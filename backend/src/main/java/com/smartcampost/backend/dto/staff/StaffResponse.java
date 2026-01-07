package com.smartcampost.backend.dto.staff;

import com.smartcampost.backend.model.enums.StaffStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffResponse {

    private UUID id;
    private String fullName;

    // ✅ Keep role as String (matches Staff model + existing API)
    private String role;

    private String email;
    private String phone;
    private StaffStatus status;
    private LocalDate hiredAt;
    private LocalDate terminatedAt;
}
