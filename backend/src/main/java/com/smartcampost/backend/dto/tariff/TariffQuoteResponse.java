package com.smartcampost.backend.dto.tariff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TariffQuoteResponse {

    private UUID tariffId;
    private UUID parcelId;          // null si c'était juste un quote

    private String serviceType;
    private String originZone;
    private String destinationZone;
    private String weightBracket;

    private Double basePrice;       // prix du tarif sélectionné

    private boolean applied;        // true si PricingDetail a été créé
}
