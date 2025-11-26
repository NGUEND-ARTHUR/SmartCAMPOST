package com.smartcampost.backend.dto.pickup;

import lombok.Data;

import java.util.UUID;

@Data
public class AssignCourierRequest {
    private UUID courierId;
}
