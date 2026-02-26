package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.PricingDetail;
import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PricingDetailRepository;
import com.smartcampost.backend.repository.TariffRepository;
import com.smartcampost.backend.service.GeolocationService;
import com.smartcampost.backend.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PricingServiceImpl implements PricingService {

    private final ParcelRepository parcelRepository;
    private final TariffRepository tariffRepository;
    private final PricingDetailRepository pricingDetailRepository;
        private final GeolocationService geolocationService;

        @Value("${smartcampost.pricing.home-delivery.enabled:true}")
        private boolean homeDeliverySurchargeEnabled;

        /**
         * Simple per-km surcharge (XAF) for HOME delivery.
         * If 0, surcharge is disabled.
         */
        @Value("${smartcampost.pricing.home-delivery.per-km-fee-xaf:0}")
        private double homeDeliveryPerKmFeeXaf;

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

        @SuppressWarnings("null")
        PricingDetail saved = pricingDetailRepository.save(pricingDetail);
        return saved;
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

        @SuppressWarnings("null")
        PricingDetail saved = pricingDetailRepository.save(pricingDetail);
        return saved;
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
                double basePrice = tariffRepository.findByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                parcel.getServiceType(),
                originZone,
                destZone,
                weightBracket
        ).map(t -> t.getPrice().doubleValue())
         .orElseGet(() -> calculateDefaultPrice(weight, parcel.getServiceType().name()));

                double surcharge = calculateHomeDeliverySurcharge(parcel);
                return basePrice + surcharge;
    }

        private double calculateHomeDeliverySurcharge(Parcel parcel) {
                if (parcel == null) return 0.0;
                if (!homeDeliverySurchargeEnabled) return 0.0;
                if (homeDeliveryPerKmFeeXaf <= 0) return 0.0;
                if (parcel.getDeliveryOption() == null || parcel.getDeliveryOption().name() == null) return 0.0;
                if (!"HOME".equalsIgnoreCase(parcel.getDeliveryOption().name())) return 0.0;

                try {
                        var from = getOriginCoordinates(parcel);
                        var to = getRecipientCoordinates(parcel);
                        if (from == null || to == null) return 0.0;

                        var req = new com.smartcampost.backend.dto.geo.RouteEtaRequest();
                        req.setFromLat(from.latitude);
                        req.setFromLng(from.longitude);
                        req.setToLat(to.latitude);
                        req.setToLng(to.longitude);
                        var eta = geolocationService.calculateRouteEta(req);
                        if (eta == null || eta.getDistanceKm() == null) return 0.0;

                        double distanceKm = Math.max(0.0, eta.getDistanceKm());
                        double raw = distanceKm * homeDeliveryPerKmFeeXaf;

                        // Round up to nearest XAF (no decimals)
                        return BigDecimal.valueOf(raw)
                                        .setScale(0, RoundingMode.CEILING)
                                        .doubleValue();

                } catch (Exception ignored) {
                        // Best-effort surcharge: if geo fails, do not block pricing.
                        return 0.0;
                }
        }

        private record LatLng(double latitude, double longitude) {}

        private LatLng getOriginCoordinates(Parcel parcel) {
                if (parcel == null) return null;

                // Prefer explicit origin agency if provided, otherwise sender address
                if (parcel.getOriginAgency() != null) {
                        String query = String.format("%s, %s, %s, %s",
                                        safe(parcel.getOriginAgency().getAgencyName()),
                                        safe(parcel.getOriginAgency().getCity()),
                                        safe(parcel.getOriginAgency().getRegion()),
                                        safe(parcel.getOriginAgency().getCountry()));
                        LatLng ll = geocode(query);
                        if (ll != null) return ll;
                }

                return addressLatLngOrGeocode(parcel.getSenderAddress());
        }

        private LatLng getRecipientCoordinates(Parcel parcel) {
                if (parcel == null) return null;
                return addressLatLngOrGeocode(parcel.getRecipientAddress());
        }

        private LatLng addressLatLngOrGeocode(com.smartcampost.backend.model.Address address) {
                if (address == null) return null;
                try {
                        if (address.getLatitude() != null && address.getLongitude() != null) {
                                return new LatLng(address.getLatitude().doubleValue(), address.getLongitude().doubleValue());
                        }
                } catch (Exception ignored) {
                        // fall back to geocode
                }

                String query = String.format("%s, %s, %s, %s",
                                safe(address.getStreet()),
                                safe(address.getCity()),
                                safe(address.getRegion()),
                                safe(address.getCountry()));
                return geocode(query);
        }

        private LatLng geocode(String addressLine) {
                if (addressLine == null || addressLine.isBlank()) return null;
                var req = new com.smartcampost.backend.dto.geo.GeocodeRequest();
                req.setAddressLine(addressLine);
                var resp = geolocationService.geocode(req);
                if (resp == null) return null;
                return new LatLng(resp.getLatitude(), resp.getLongitude());
        }

        private String safe(String s) {
                return s == null ? "" : s.trim();
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
