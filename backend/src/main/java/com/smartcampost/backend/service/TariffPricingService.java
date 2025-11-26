package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.tariff.TariffQuoteRequest;
import com.smartcampost.backend.dto.tariff.TariffQuoteResponse;

public interface TariffPricingService {

    TariffQuoteResponse quotePrice(TariffQuoteRequest request);
}
