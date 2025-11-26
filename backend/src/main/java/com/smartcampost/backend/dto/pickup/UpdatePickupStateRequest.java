package com.smartcampost.backend.dto.pickup;

import com.smartcampost.backend.model.enums.PickupRequestState;
import lombok.Data;

@Data
public class UpdatePickupStateRequest {
    private PickupRequestState state;
}
