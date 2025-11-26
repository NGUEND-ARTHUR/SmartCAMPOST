package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.courier.*;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface CourierService {

    // US17: Admin registers couriers
    CourierResponse createCourier(CreateCourierRequest request);

    // Get by ID
    CourierResponse getCourierById(UUID courierId);

    // List with pagination
    Page<CourierResponse> listCouriers(int page, int size);

    // US19: Update status
    CourierResponse updateCourierStatus(UUID courierId, UpdateCourierStatusRequest request);

    // US18: Update vehicle identifier
    CourierResponse updateCourierVehicle(UUID courierId, UpdateCourierVehicleRequest request);
}
