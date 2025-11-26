package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.tariff.CreateTariffRequest;
import com.smartcampost.backend.dto.tariff.TariffResponse;
import com.smartcampost.backend.dto.tariff.UpdateTariffRequest;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface TariffService {

    TariffResponse createTariff(CreateTariffRequest request);

    TariffResponse updateTariff(UUID tariffId, UpdateTariffRequest request);

    TariffResponse getTariffById(UUID tariffId);

    Page<TariffResponse> listTariffs(int page, int size, String serviceType);

    void deleteTariff(UUID tariffId);
}
