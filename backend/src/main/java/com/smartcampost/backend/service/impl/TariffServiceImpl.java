package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.tariff.CreateTariffRequest;
import com.smartcampost.backend.dto.tariff.TariffResponse;
import com.smartcampost.backend.dto.tariff.UpdateTariffRequest;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.model.enums.ServiceType;
import com.smartcampost.backend.repository.TariffRepository;
import com.smartcampost.backend.service.TariffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TariffServiceImpl implements TariffService {

    private final TariffRepository tariffRepository;

    @Override
    public TariffResponse createTariff(CreateTariffRequest request) {

        ServiceType serviceType = parseServiceType(request.getServiceType());

        String originZone = normalizeZone(request.getOriginZone());
        String destinationZone = normalizeZone(request.getDestinationZone());
        String weightBracket = request.getWeightBracket().trim();

        // Unicité sur combinaison
        if (tariffRepository.existsByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                serviceType, originZone, destinationZone, weightBracket
        )) {
            throw new ConflictException(
                    "Tariff already exists for this combination",
                    ErrorCode.TARIFF_CONFLICT
            );
        }

        Tariff tariff = Tariff.builder()
                .id(UUID.randomUUID())
                .serviceType(serviceType)
                .originZone(originZone)
                .destinationZone(destinationZone)
                .weightBracket(weightBracket)
                .price(request.getPrice())
                .build();

        tariffRepository.save(tariff);

        return toResponse(tariff);
    }

    @Override
    public TariffResponse updateTariff(UUID tariffId, UpdateTariffRequest request) {
        Tariff tariff = tariffRepository.findById(tariffId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tariff not found",
                        ErrorCode.TARIFF_NOT_FOUND
                ));

        if (request.getPrice() != null) {
            tariff.setPrice(request.getPrice());
        }

        tariffRepository.save(tariff);

        return toResponse(tariff);
    }

    @Override
    public TariffResponse getTariffById(UUID tariffId) {
        Tariff tariff = tariffRepository.findById(tariffId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tariff not found",
                        ErrorCode.TARIFF_NOT_FOUND
                ));
        return toResponse(tariff);
    }

    @Override
    public Page<TariffResponse> listTariffs(int page, int size, String serviceTypeStr) {

        Page<Tariff> result;

        if (serviceTypeStr != null && !serviceTypeStr.isBlank()) {
            ServiceType serviceType = parseServiceType(serviceTypeStr);
            result = tariffRepository.findByServiceType(serviceType, PageRequest.of(page, size));
        } else {
            result = tariffRepository.findAll(PageRequest.of(page, size));
        }

        return result.map(this::toResponse);
    }

    @Override
    public void deleteTariff(UUID tariffId) {
        Tariff tariff = tariffRepository.findById(tariffId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tariff not found",
                        ErrorCode.TARIFF_NOT_FOUND
                ));

        tariffRepository.delete(tariff);
    }

    // =====================================================
    // NEW: Find pricing tariff for a quote (uses PRICING_TARIFF_NOT_FOUND)
    // =====================================================

    /**
     * Utility method for pricing/quotation:
     * finds a tariff matching the given combination, or throws
     * PRICING_TARIFF_NOT_FOUND if none exists.
     * Not part of the TariffService interface (no @Override), so it does not
     * break existing code but can be used by quote/pricing services.
     */
    public TariffResponse findPricingTariff(
            String serviceTypeStr,
            String originZoneStr,
            String destinationZoneStr,
            String weightBracketStr
    ) {
        ServiceType serviceType = parseServiceType(serviceTypeStr);
        String originZone = normalizeZone(originZoneStr);
        String destinationZone = normalizeZone(destinationZoneStr);
        String weightBracket = weightBracketStr.trim();

        List<Tariff> all = tariffRepository.findAll();

        Tariff match = all.stream()
                .filter(t -> t.getServiceType() == serviceType)
                .filter(t -> originZone.equalsIgnoreCase(t.getOriginZone()))
                .filter(t -> destinationZone.equalsIgnoreCase(t.getDestinationZone()))
                .filter(t -> weightBracket.equalsIgnoreCase(t.getWeightBracket()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pricing tariff not found for given combination",
                        ErrorCode.PRICING_TARIFF_NOT_FOUND
                ));

        return toResponse(match);
    }

    // =============== HELPERS ===============

    private ServiceType parseServiceType(String serviceType) {
        try {
            return ServiceType.valueOf(serviceType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid serviceType: " + serviceType);
        }
    }

    private String normalizeZone(String zone) {
        return zone.trim().toUpperCase(Locale.ROOT);
    }

    private TariffResponse toResponse(Tariff tariff) {
        return TariffResponse.builder()
                .id(tariff.getId())
                .serviceType(tariff.getServiceType().name())
                .originZone(tariff.getOriginZone())
                .destinationZone(tariff.getDestinationZone())
                .weightBracket(tariff.getWeightBracket())
                .price(tariff.getPrice())
                .build();
    }
}
