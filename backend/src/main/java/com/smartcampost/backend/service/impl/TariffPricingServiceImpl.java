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
                Objects.requireNonNull(request.getOriginZone(), "originZone is required");
                Objects.requireNonNull(request.getDestinationZone(), "destinationZone is required");

        // 1) Convertir serviceType en enum
        ServiceType serviceType;
        try {
            serviceType = ServiceType.valueOf(request.getServiceType().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            // handled par GlobalExceptionHandler (RuntimeException -> BUSINESS_ERROR)
            throw new RuntimeException("Invalid service type: " + request.getServiceType());
        }

        // 2) Déterminer le weightBracket
        String weightBracket = WeightBracketResolver.resolve(request.getWeight());

        // 3) Chercher le tarif correspondant
        Tariff tariff = tariffRepository
                .findFirstByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                        serviceType,
                        request.getOriginZone(),
                        request.getDestinationZone(),
                        weightBracket
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No matching tariff found",
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

                        PricingDetail savedDetail = pricingDetailRepository.save(detail);
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
