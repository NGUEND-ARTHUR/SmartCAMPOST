package com.smartcampost.backend.dto.pickup;

import com.smartcampost.backend.model.enums.PickupRequestState;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdatePickupStateRequest {
    @NotNull(message = "state is required")
    private PickupRequestState state;
}
