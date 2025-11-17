package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.tariff.TariffQuoteRequest;
import com.smartcampost.backend.dto.tariff.TariffQuoteResponse;
import com.smartcampost.backend.dto.tariff.TariffRequest;
import com.smartcampost.backend.dto.tariff.TariffResponse;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PricingDetail;
import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PricingDetailRepository;
import com.smartcampost.backend.repository.TariffRepository;
import com.smartcampost.backend.service.TariffPricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TariffPricingServiceImpl implements TariffPricingService {

    private final TariffRepository tariffRepository;
    private final PricingDetailRepository pricingDetailRepository;
    private final ParcelRepository parcelRepository;

    @Override
    public TariffResponse createTariff(TariffRequest request) {
        Tariff tariff = Tariff.builder()
                .id(UUID.randomUUID())
                .serviceType(request.getServiceType())
                .originZone(request.getOriginZone())
                .destinationZone(request.getDestinationZone())
                .weightBracket(request.getWeightBracket())
                .price(request.getPrice())
                .build();

        tariff = tariffRepository.save(tariff);
        return toResponse(tariff);
    }

    @Override
    public List<TariffResponse> listTariffs() {
        return tariffRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TariffResponse getTariff(UUID tariffId) {
        Tariff tariff = tariffRepository.findById(tariffId)
                .orElseThrow(() -> new IllegalArgumentException("Tariff not found: " + tariffId));
        return toResponse(tariff);
    }

    @Override
    public TariffQuoteResponse quotePrice(TariffQuoteRequest request) {
        // logique simple : on cherche un tarif exact
        Tariff tariff = tariffRepository
                .findFirstByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                        request.getServiceType(),
                        request.getOriginZone(),
                        request.getDestinationZone(),
                        request.getWeightBracket()
                )
                .orElseThrow(() -> new IllegalArgumentException("No tariff found for quote"));

        BigDecimal price = tariff.getPrice();

        TariffQuoteResponse response = new TariffQuoteResponse();
        response.setTariffId(tariff.getId());
        response.setPrice(price);

        // si un parcelId est fourni, on enregistre le pricing_detail
        if (request.getParcelId() != null) {
            Parcel parcel = parcelRepository.findById(request.getParcelId())
                    .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + request.getParcelId()));

            PricingDetail detail = PricingDetail.builder()
                    .id(UUID.randomUUID())
                    .parcel(parcel)
                    .tariff(tariff)
                    .appliedPrice(price)
                    .build();

            pricingDetailRepository.save(detail);
        }

        return response;
    }

    private TariffResponse toResponse(Tariff tariff) {
        TariffResponse dto = new TariffResponse();
        dto.setId(tariff.getId());
        dto.setServiceType(tariff.getServiceType());
        dto.setOriginZone(tariff.getOriginZone());
        dto.setDestinationZone(tariff.getDestinationZone());
        dto.setWeightBracket(tariff.getWeightBracket());
        dto.setPrice(tariff.getPrice());
        return dto;
    }
}
