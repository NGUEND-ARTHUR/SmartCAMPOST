package com.smartcampost.backend.dto.tariff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TariffQuoteRequest {

    @NotBlank
    private String serviceType;       // "STANDARD" ou "EXPRESS"

    @NotBlank
    private String originZone;

    @NotBlank
    private String destinationZone;

    @Positive
    private double weight;

    /**
     * Optionnel :
     * - si null => on fait juste une simulation de prix
     * - si NON null => on enregistre un PricingDetail pour ce parcel
     */
    private UUID parcelId;
}
