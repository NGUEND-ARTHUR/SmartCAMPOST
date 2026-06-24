package com.smartcampost.backend.dto.tariff;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateTariffRequest {

    // Pour rester simple : on ne met à jour que le prix
    @NotNull
    @Positive
    private BigDecimal price;
}
