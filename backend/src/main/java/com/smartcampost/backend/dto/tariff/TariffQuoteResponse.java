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
    private UUID parcelId;

    private String serviceType;
    private String originZone;
    private String destinationZone;
    private String weightBracket;

    private Double basePrice;

    // Frontend-facing fields expected by the UI
    private Double estimatedPrice;
    private String currency;
    private Breakdown breakdown;

    private boolean applied;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Breakdown {
        private Double basePrice;
        private Double weightCharge;
        private Double extras;
    }
}
