package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Courier;

import java.util.List;
import java.util.UUID;

public interface CourierService {

    Courier registerCourier(Courier courier);

    Courier getCourier(UUID courierId);

    List<Courier> listCouriersForAgency(UUID agencyId);
}
