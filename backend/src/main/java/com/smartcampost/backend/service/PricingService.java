package com.smartcampost.backend.service;

import com.smartcampost.backend.model.PricingDetail;

import java.math.BigDecimal;
import java.util.UUID;

public interface PricingService {

    BigDecimal quotePrice(UUID parcelId);

    PricingDetail confirmPrice(UUID parcelId);
}
