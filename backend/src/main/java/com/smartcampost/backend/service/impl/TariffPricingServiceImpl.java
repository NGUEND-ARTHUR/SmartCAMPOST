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

        // Resolve zones: use originZone/destinationZone if set, otherwise fall back to city, then NATIONAL
        String originZone = request.getOriginZone();
        if (originZone == null || originZone.isBlank()) {
            originZone = request.getOriginCity() != null ? request.getOriginCity().toUpperCase() : "NATIONAL";
        } else {
            originZone = originZone.toUpperCase();
        }
        String destZone = request.getDestinationZone();
        if (destZone == null || destZone.isBlank()) {
            destZone = request.getDestinationCity() != null ? request.getDestinationCity().toUpperCase() : "NATIONAL";
        } else {
            destZone = destZone.toUpperCase();
        }

        ServiceType serviceType;
        try {
            serviceType = ServiceType.valueOf(request.getServiceType().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid service type: " + request.getServiceType());
        }

        String weightBracket = WeightBracketResolver.resolve(request.getWeight());

        // Try exact zone match, then NATIONAL fallback
        final String oz = originZone;
        final String dz = destZone;
        Tariff tariff = tariffRepository
                .findFirstByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                        serviceType, oz, dz, weightBracket
                )
                .or(() -> tariffRepository.findFirstByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                        serviceType, "NATIONAL", "NATIONAL", weightBracket
                ))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No matching tariff found for " + oz + " -> " + dz + " (" + weightBracket + ")",
                        ErrorCode.TARIFF_NOT_FOUND
                ));

        Double basePrice = tariff.getPrice().doubleValue();

        UUID parcelId = request.getParcelId();
        boolean applied = false;

        // 4) Si on a un parcelId, on applique et on sauvegarde un PricingDetail
        if (parcelId != null) {
            Parcel parcel = parcelRepository.findById(parcelId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parcel not found",
                            ErrorCode.PARCEL_NOT_FOUND
                    ));

            PricingDetail detail = PricingDetail.builder()
                    .parcel(parcel)
                    .tariff(tariff)
                    .appliedPrice(basePrice)
                    .appliedAt(Instant.now())
                    .build();

                        pricingDetailRepository.save(detail);
            applied = true;
        }

        // 5) Réponse du quote
        return TariffQuoteResponse.builder()
                .tariffId(tariff.getId())
                .parcelId(parcelId)
                .serviceType(tariff.getServiceType().name())
                .originZone(tariff.getOriginZone())
                .destinationZone(tariff.getDestinationZone())
                .weightBracket(tariff.getWeightBracket())
                .basePrice(basePrice)
                .applied(applied)
                .build();
    }
}
