package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.tariff.TariffRequest;
import com.smartcampost.backend.dto.tariff.TariffResponse;
import com.smartcampost.backend.dto.tariff.TariffQuoteRequest;
import com.smartcampost.backend.dto.tariff.TariffQuoteResponse;

import java.util.List;
import java.util.UUID;

public interface TariffPricingService {

    TariffResponse createTariff(TariffRequest request);

    List<TariffResponse> listTariffs();

    TariffResponse getTariff(UUID tariffId);

    TariffQuoteResponse quotePrice(TariffQuoteRequest request);
}
