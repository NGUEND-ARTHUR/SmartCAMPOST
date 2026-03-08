package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.DeliveryOption;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ChangeDeliveryOptionRequest {

    @NotNull(message = "newDeliveryOption is required (AGENCY or HOME)")
    private DeliveryOption newDeliveryOption;  // AGENCY or HOME

    // Optional: if switching HOME => might cost more
    private BigDecimal additionalAmount;
}
