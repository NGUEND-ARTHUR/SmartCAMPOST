package com.smartcampost.backend.dto.courier;

import com.smartcampost.backend.model.enums.CourierStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourierResponse {

    private UUID id;
    private String fullName;
    private String phone;
    private String vehicleId;
    private CourierStatus status;
    private Instant createdAt;
}
