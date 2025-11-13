package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.model.enums.ServiceType;

import java.util.List;
import java.util.UUID;

public interface TariffService {

    Tariff createTariff(Tariff tariff);

    Tariff updateTariff(UUID tariffId, Tariff tariff);

    List<Tariff> findTariffs(ServiceType serviceType, String originZone, String destinationZone);
}
