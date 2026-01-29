package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.courier.*;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Courier;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.CourierStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.CourierService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.springframework.lang.NonNull;

@Service
@RequiredArgsConstructor
public class CourierServiceImpl implements CourierService {

    private final CourierRepository courierRepository;
    private final UserAccountRepository userAccountRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ================= CREATE COURIER =================
    @Override
        public CourierResponse createCourier(@NonNull CreateCourierRequest request) {
                Objects.requireNonNull(request, "request is required");

        // Unicité du téléphone (courier + user_account)
        if (courierRepository.existsByPhone(request.getPhone())
                || userAccountRepository.existsByPhone(request.getPhone())) {
            throw new ConflictException(
                    "Phone already in use",
                    ErrorCode.COURIER_PHONE_EXISTS
            );
        }

        String encodedPassword = encoder.encode(request.getPassword());

        // Créer Courier
        Courier courier = Courier.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .vehicleId(request.getVehicleId())
                .status(CourierStatus.AVAILABLE) // par défaut disponible
                .passwordHash(encodedPassword)
                .createdAt(Instant.now())
                .build();

        Courier savedCourier = Objects.requireNonNull(courierRepository.save(courier), "failed to save courier");

        // Créer UserAccount pour login Courier
        UserAccount account = UserAccount.builder()
                .id(UUID.randomUUID())
                .phone(request.getPhone())
                .passwordHash(encodedPassword)
                .role(UserRole.COURIER)
                .entityId(savedCourier.getId())
                .build();

        UserAccount savedAccount = userAccountRepository.save(account);
        if (savedAccount == null) throw new IllegalStateException("failed to save user account");
        account = savedAccount;

        return toResponse(savedCourier);
    }

    // ================= GET BY ID =================
    @Override
        public CourierResponse getCourierById(@NonNull UUID courierId) {
                Objects.requireNonNull(courierId, "courierId is required");
        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Courier not found",
                                ErrorCode.COURIER_NOT_FOUND
                        ));
        return toResponse(courier);
    }

    // ================= LIST COURIERS =================
    @Override
    public Page<CourierResponse> listCouriers(int page, int size) {
        return courierRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================= UPDATE STATUS =================
    @Override
        public CourierResponse updateCourierStatus(@NonNull UUID courierId, @NonNull UpdateCourierStatusRequest request) {
                Objects.requireNonNull(courierId, "courierId is required");
                Objects.requireNonNull(request, "request is required");
        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Courier not found",
                                ErrorCode.COURIER_NOT_FOUND
                        ));

        courier.setStatus(request.getStatus());
        courierRepository.save(courier);

        return toResponse(courier);
    }

    // ================= UPDATE VEHICLE =================
    @Override
        public CourierResponse updateCourierVehicle(@NonNull UUID courierId, @NonNull UpdateCourierVehicleRequest request) {
                Objects.requireNonNull(courierId, "courierId is required");
                Objects.requireNonNull(request, "request is required");
        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Courier not found",
                                ErrorCode.COURIER_NOT_FOUND
                        ));

        courier.setVehicleId(request.getVehicleId());
        courierRepository.save(courier);

        return toResponse(courier);
    }

    // ================= HELPER =================
    private CourierResponse toResponse(Courier courier) {
        return CourierResponse.builder()
                .id(courier.getId())
                .fullName(courier.getFullName())
                .phone(courier.getPhone())
                .vehicleId(courier.getVehicleId())
                .status(courier.getStatus())
                .createdAt(courier.getCreatedAt())
                .build();
    }
}
