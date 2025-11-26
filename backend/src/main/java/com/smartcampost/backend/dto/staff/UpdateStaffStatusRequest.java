package com.smartcampost.backend.dto.staff;

import com.smartcampost.backend.model.enums.StaffStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStaffStatusRequest {

    @NotNull
    private StaffStatus status; // ACTIVE / INACTIVE / SUSPENDED
}
