package com.smartcampost.backend.dto.courier;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourierVehicleRequest {

    @NotBlank
    @Pattern(
            regexp = "^[A-Z0-9-]{3,20}$",
            message = "Vehicle ID must contain 3–20 characters [A-Z, 0-9, -]"
    )
    private String vehicleId;
}
