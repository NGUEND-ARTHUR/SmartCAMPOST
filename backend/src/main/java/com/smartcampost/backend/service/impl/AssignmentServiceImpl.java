package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.delivery.StartDeliveryRequest;
import com.smartcampost.backend.dto.delivery.StartDeliveryResponse;
import com.smartcampost.backend.service.AssignmentService;
import com.smartcampost.backend.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final DeliveryService deliveryService;

    @Override
    public StartDeliveryResponse assignCourier(UUID parcelId, UUID courierId, String reason) {
        StartDeliveryRequest req = new StartDeliveryRequest();
        req.setParcelId(parcelId);
        req.setCourierId(courierId);
        req.setNotes(reason);
        return deliveryService.startDelivery(req);
    }
}
