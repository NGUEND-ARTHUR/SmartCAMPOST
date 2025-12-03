package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.DeliveryOption;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ChangeDeliveryOptionRequest {

    private DeliveryOption newDeliveryOption;  // AGENCY or HOME

    // Optional: if switching HOME => might cost more
    private BigDecimal additionalAmount;
}
