package com.smartcampost.backend.dto.pickup;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignPickupCourierRequest {

    @NotNull
    private UUID courierId;
}
