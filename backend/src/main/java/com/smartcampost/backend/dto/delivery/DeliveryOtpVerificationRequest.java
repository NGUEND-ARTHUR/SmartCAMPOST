package com.smartcampost.backend.dto.delivery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.UUID;

@Data
public class DeliveryOtpVerificationRequest {
    @NotNull(message = "parcelId is required")
    private UUID parcelId;

    @NotBlank(message = "otpCode is required")
    @Pattern(regexp = "^[0-9]{4,8}$", message = "OTP must be 4–8 digits")
    private String otpCode;

    private Double latitude;
    private Double longitude;
    private String notes;
}
