package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.tariff.TariffQuoteRequest;
import com.smartcampost.backend.dto.tariff.TariffQuoteResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PricingDetail;
import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.model.enums.ServiceType;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PricingDetailRepository;
import com.smartcampost.backend.repository.TariffRepository;
import com.smartcampost.backend.service.TariffPricingService;
import com.smartcampost.backend.util.WeightBracketResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TariffPricingServiceImpl implements TariffPricingService {

    private final TariffRepository tariffRepository;
    private final ParcelRepository parcelRepository;
    private final PricingDetailRepository pricingDetailRepository;

    @Override
    public TariffQuoteResponse quotePrice(TariffQuoteRequest request) {

        Objects.requireNonNull(request, "request is required");
        Objects.requireNonNull(request.getServiceType(), "serviceType is required");

        // Resolve and normalise zones
        String originZone = normaliseZone(
                request.getOriginZone() != null ? request.getOriginZone() : request.getOriginCity());
        String destZone = normaliseZone(
                request.getDestinationZone() != null ? request.getDestinationZone() : request.getDestinationCity());

        ServiceType serviceType;
        try {
            serviceType = ServiceType.valueOf(request.getServiceType().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid service type: " + request.getServiceType());
        }

        String weightBracket = WeightBracketResolver.resolve(request.getWeight());

        final String oz = originZone;
        final String dz = destZone;

        // 1) Exact zone match
        // 2) NATIONAL/NATIONAL same bracket
        // 3) Any tariff for this service type (broadest fallback)
        Tariff tariff = tariffRepository
                .findFirstByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(serviceType, oz, dz, weightBracket)
                .or(() -> tariffRepository.findFirstByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                        serviceType, "NATIONAL", "NATIONAL", weightBracket))
                .or(() -> tariffRepository.findFirstByServiceTypeAndOriginZoneAndDestinationZone(
                        serviceType, "NATIONAL", "NATIONAL"))
                .or(() -> tariffRepository.findFirstByServiceType(serviceType))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No tariff configured for service type " + serviceType,
                        ErrorCode.TARIFF_NOT_FOUND));

        double basePrice = tariff.getPrice().doubleValue();
        // Weight surcharge: +5% per kg above 5 kg to reward correct weight entry
        double weightCharge = request.getWeight() > 5.0
                ? Math.round((request.getWeight() - 5.0) * basePrice * 0.05) : 0.0;
        double total = basePrice + weightCharge;

        UUID parcelId = request.getParcelId();
        boolean applied = false;

        if (parcelId != null) {
            Parcel parcel = parcelRepository.findById(parcelId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

            PricingDetail detail = PricingDetail.builder()
                    .parcel(parcel)
                    .tariff(tariff)
                    .appliedPrice(total)
                    .appliedAt(Instant.now())
                    .build();
            pricingDetailRepository.save(detail);
            applied = true;
        }

        return TariffQuoteResponse.builder()
                .tariffId(tariff.getId())
                .parcelId(parcelId)
                .serviceType(tariff.getServiceType().name())
                .originZone(oz)
                .destinationZone(dz)
                .weightBracket(weightBracket)
                .basePrice(basePrice)
                .estimatedPrice(total)
                .currency("XAF")
                .breakdown(TariffQuoteResponse.Breakdown.builder()
                        .basePrice(basePrice)
                        .weightCharge(weightCharge)
                        .extras(0.0)
                        .build())
                .applied(applied)
                .build();
    }

    /**
     * Normalises a region/zone string to a consistent UPPERCASE key.
     * Maps common French Cameroonian region names to their English equivalents
     * so that "Centre" and "CENTER" both resolve to the same tariff zone.
     */
    private static final java.util.Map<String, String> ZONE_ALIASES = java.util.Map.ofEntries(
            java.util.Map.entry("CENTRE", "CENTER"),
            java.util.Map.entry("LITTORAL", "LITTORAL"),
            java.util.Map.entry("OUEST", "WEST"),
            java.util.Map.entry("NORD OUEST", "NORTHWEST"),
            java.util.Map.entry("NORDOUEST", "NORTHWEST"),
            java.util.Map.entry("SUD OUEST", "SOUTHWEST"),
            java.util.Map.entry("SUDOUEST", "SOUTHWEST"),
            java.util.Map.entry("ADAMAOUA", "ADAMAWA"),
            java.util.Map.entry("EXTRÊME NORD", "FAR NORTH"),
            java.util.Map.entry("EXTREME NORD", "FAR NORTH"),
            java.util.Map.entry("FAR-NORTH", "FAR NORTH")
    );

    private String normaliseZone(String raw) {
        if (raw == null || raw.isBlank()) return "NATIONAL";
        String upper = raw.trim().toUpperCase(Locale.ROOT);
        return ZONE_ALIASES.getOrDefault(upper, upper);
    }
}
