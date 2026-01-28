package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PricingDetail;
import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PricingDetailRepository;
import com.smartcampost.backend.repository.TariffRepository;
import com.smartcampost.backend.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PricingServiceImpl implements PricingService {

    private final ParcelRepository parcelRepository;
    private final TariffRepository tariffRepository;
    private final PricingDetailRepository pricingDetailRepository;

    @Override
    public BigDecimal quotePrice(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        // Find matching tariff based on service type, zones, and weight
        Double price = calculatePrice(parcel);
        return price != null ? BigDecimal.valueOf(price) : BigDecimal.ZERO;
    }

    @Override
    public PricingDetail confirmPrice(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        Double price = calculatePrice(parcel);
        
        // Find or create tariff reference
        Tariff tariff = findMatchingTariff(parcel);

        PricingDetail pricingDetail = PricingDetail.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .tariff(tariff)
                .appliedPrice(price != null ? price : 0.0)
                .appliedAt(Instant.now())
                .build();

        return pricingDetailRepository.save(pricingDetail);
    }

    @Override
    public PricingDetail recalculatePriceForParcel(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        // Use validated weight if available, otherwise use declared weight
        Double weightToUse = parcel.getValidatedWeight() != null 
                ? parcel.getValidatedWeight() 
                : parcel.getWeight();

        Double newPrice = calculatePriceForWeight(parcel, weightToUse);
        
        // Find or create tariff reference
        Tariff tariff = findMatchingTariff(parcel);

        // Create a new pricing detail record for audit trail
        PricingDetail pricingDetail = PricingDetail.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .tariff(tariff)
                .appliedPrice(newPrice)
                .appliedAt(Instant.now())
                .build();

        return pricingDetailRepository.save(pricingDetail);
    }

    // ================== PRIVATE HELPERS ==================

    private Double calculatePrice(Parcel parcel) {
        return calculatePriceForWeight(parcel, parcel.getWeight());
    }

    private Double calculatePriceForWeight(Parcel parcel, Double weight) {
        // Get origin and destination zones from addresses
        String originZone = getZoneFromAddress(parcel.getSenderAddress());
        String destZone = getZoneFromAddress(parcel.getRecipientAddress());
        String weightBracket = getWeightBracket(weight);

        // Find matching tariff
        return tariffRepository.findByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                parcel.getServiceType(),
                originZone,
                destZone,
                weightBracket
        ).map(t -> t.getPrice().doubleValue())
         .orElseGet(() -> calculateDefaultPrice(weight, parcel.getServiceType().name()));
    }

    private Tariff findMatchingTariff(Parcel parcel) {
        String originZone = getZoneFromAddress(parcel.getSenderAddress());
        String destZone = getZoneFromAddress(parcel.getRecipientAddress());
        Double weight = parcel.getValidatedWeight() != null 
                ? parcel.getValidatedWeight() 
                : parcel.getWeight();
        String weightBracket = getWeightBracket(weight);

        return tariffRepository.findByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                parcel.getServiceType(),
                originZone,
                destZone,
                weightBracket
        ).orElseThrow(() -> new ResourceNotFoundException(
                "Pricing tariff not found",
                ErrorCode.PRICING_TARIFF_NOT_FOUND
        ));
    }

    private String getZoneFromAddress(com.smartcampost.backend.model.Address address) {
        if (address == null) return "NATIONAL";
        // Use region for zone determination
        return address.getRegion() != null ? address.getRegion().toUpperCase() : "NATIONAL";
    }

    private String getWeightBracket(Double weight) {
        if (weight == null || weight <= 0.5) return "0-0.5";
        if (weight <= 1.0) return "0.5-1";
        if (weight <= 2.0) return "1-2";
        if (weight <= 5.0) return "2-5";
        if (weight <= 10.0) return "5-10";
        if (weight <= 20.0) return "10-20";
        return "20+";
    }

    private Double calculateDefaultPrice(Double weight, String serviceType) {
        // Default pricing when no tariff is found
        // Base price + per kg rate
        double basePrice = "EXPRESS".equals(serviceType) ? 2000.0 : 1000.0;
        double perKgRate = "EXPRESS".equals(serviceType) ? 500.0 : 300.0;
        
        double totalPrice = basePrice + (weight * perKgRate);
        return totalPrice;
    }
}
