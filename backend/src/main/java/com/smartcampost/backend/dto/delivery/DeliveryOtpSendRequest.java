package com.smartcampost.backend.dto.delivery;

import lombok.Data;

import java.util.UUID;

@Data
public class DeliveryOtpSendRequest {
    private UUID parcelId;
    private String phoneNumber; // recipient phone
}
