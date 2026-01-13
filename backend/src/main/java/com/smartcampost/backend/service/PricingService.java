package com.smartcampost.backend.service;

import com.smartcampost.backend.model.PricingDetail;

import java.math.BigDecimal;
import java.util.UUID;

public interface PricingService {

    BigDecimal quotePrice(UUID parcelId);

    PricingDetail confirmPrice(UUID parcelId);

    /**
     * Recalculate price for a parcel after weight/dimensions have been validated.
     * Called when agent validates and finds the actual weight differs from declared.
     * @param parcelId The parcel to recalculate pricing for
     * @return Updated pricing detail
     */
    PricingDetail recalculatePriceForParcel(UUID parcelId);
}
