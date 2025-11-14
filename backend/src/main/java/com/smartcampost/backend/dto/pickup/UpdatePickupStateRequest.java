package com.smartcampost.backend.dto.pickup;

import com.smartcampost.backend.model.enums.PickupState;
import lombok.Data;

@Data
public class UpdatePickupStateRequest {
    private PickupState state;
    private String reason;
}
