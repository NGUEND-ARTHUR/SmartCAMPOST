package com.smartcampost.backend.dto.tariff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateTariffRequest {

    @NotBlank
    private String serviceType;      // ex: "EXPRESS", "STANDARD" (enum ServiceType)

    @NotBlank
    private String originZone;       // ex: "YAOUNDE", "DLA_ZONE1"

    @NotBlank
    private String destinationZone;

    @NotBlank
    private String weightBracket;    // ex: "0-1kg", "1-5kg", "5-10kg"

    @NotNull
    @Positive
    private BigDecimal price;        // base price pour ce bracket
}
