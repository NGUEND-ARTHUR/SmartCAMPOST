package com.smartcampost.backend.dto.courier;

import com.smartcampost.backend.model.enums.CourierStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourierStatusRequest {

    @NotNull
    private CourierStatus status; // e.g. AVAILABLE, INACTIVE, ON_ROUTE
}
