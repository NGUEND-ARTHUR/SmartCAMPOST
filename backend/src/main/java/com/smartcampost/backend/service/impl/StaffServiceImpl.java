package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.staff.*;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Staff;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.StaffStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.StaffRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final UserAccountRepository userAccountRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ================= CREATE STAFF =================
    @Override
    public StaffResponse createStaff(CreateStaffRequest request) {

        // Pré-calculer les conflits
        boolean emailExists = staffRepository.existsByEmail(request.getEmail());
        boolean phoneExists = staffRepository.existsByPhone(request.getPhone())
                || userAccountRepository.existsByPhone(request.getPhone());

        // 🔥 Conflit global staff (email + phone)
        if (emailExists && phoneExists) {
            throw new ConflictException(
                    "Staff conflict: email and phone already in use",
                    ErrorCode.STAFF_CONFLICT
            );
        }

        // Email unique
        if (emailExists) {
            throw new ConflictException(
                    "Email already in use",
                    ErrorCode.STAFF_EMAIL_EXISTS
            );
        }

        // Phone unique (Staff + UserAccount)
        if (phoneExists) {
            throw new ConflictException(
                    "Phone already in use",
                    ErrorCode.STAFF_PHONE_EXISTS
            );
        }

        String encodedPassword = encoder.encode(request.getPassword());

        // Staff
        Staff staff = Staff.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .role(request.getRole())
                .email(request.getEmail())
                .phone(request.getPhone())
                .status(StaffStatus.ACTIVE)
                .hiredAt(request.getHiredAt() != null ? request.getHiredAt() : LocalDate.now())
                .passwordHash(encodedPassword)
                .build();

        staffRepository.save(staff);

        // UserAccount pour login STAFF
        UserAccount account = UserAccount.builder()
                .id(UUID.randomUUID())
                .phone(request.getPhone())
                .passwordHash(encodedPassword)
                .role(UserRole.STAFF)
                .entityId(staff.getId())
                .build();

        userAccountRepository.save(account);

        return toResponse(staff);
    }

    // ================= GET BY ID =================
    @Override
    public StaffResponse getStaffById(UUID staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Staff not found",
                                ErrorCode.STAFF_NOT_FOUND
                        ));
        return toResponse(staff);
    }

    // ================= LIST STAFF =================
    @Override
    public Page<StaffResponse> listStaff(int page, int size) {
        return staffRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================= UPDATE STATUS =================
    @Override
    public StaffResponse updateStaffStatus(UUID staffId, UpdateStaffStatusRequest request) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Staff not found",
                                ErrorCode.STAFF_NOT_FOUND
                        ));

        staff.setStatus(request.getStatus());

        // si on le passe INACTIVE, on peut marquer terminatedAt
        if (request.getStatus() == StaffStatus.INACTIVE && staff.getTerminatedAt() == null) {
            staff.setTerminatedAt(LocalDate.now());
        }

        staffRepository.save(staff);
        return toResponse(staff);
    }

    // ================= UPDATE ROLE =================
    @Override
    public StaffResponse updateStaffRole(UUID staffId, UpdateStaffRoleRequest request) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Staff not found",
                                ErrorCode.STAFF_NOT_FOUND
                        ));

        staff.setRole(request.getRole());
        staffRepository.save(staff);

        return toResponse(staff);
    }

    // ================= HELPER =================
    private StaffResponse toResponse(Staff staff) {
        return StaffResponse.builder()
                .id(staff.getId())
                .fullName(staff.getFullName())
                .role(staff.getRole())
                .email(staff.getEmail())
                .phone(staff.getPhone())
                .status(staff.getStatus())
                .hiredAt(staff.getHiredAt())
                .terminatedAt(staff.getTerminatedAt())
                .build();
    }
}
