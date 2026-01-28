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
import java.util.Objects;
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

        Objects.requireNonNull(request, "request is required");

        // ✅ Convert role String -> enum
        UserRole role = parseUserRole(request.getRole());

        // ✅ Validate role: only STAFF-like roles are allowed for staff creation
        validateStaffUserRole(role);

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
                .role(role.name()) // ✅ Staff.role is STRING in your model
                .email(request.getEmail())
                .phone(request.getPhone())
                .status(StaffStatus.ACTIVE)
                .hiredAt(request.getHiredAt() != null ? request.getHiredAt() : LocalDate.now())
                .passwordHash(encodedPassword)
                .build();

        staffRepository.save(staff);

        // ✅ UserAccount pour login STAFF-like (role must match staff role)
        UserAccount account = UserAccount.builder()
                .id(UUID.randomUUID())
                .phone(request.getPhone())
                .passwordHash(encodedPassword)
                .role(role) // ✅ UserAccount.role is ENUM
                .entityId(staff.getId())
                .build();

        userAccountRepository.save(account);

        return toResponse(staff);
    }

    // ================= GET BY ID =================
    @Override
    public StaffResponse getStaffById(UUID staffId) {
        Objects.requireNonNull(staffId, "staffId is required");
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
        Objects.requireNonNull(staffId, "staffId is required");
        Objects.requireNonNull(request, "request is required");
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

        Objects.requireNonNull(staffId, "staffId is required");
        Objects.requireNonNull(request, "request is required");

        // ✅ Convert role String -> enum
        UserRole role = parseUserRole(request.getRole());

        // ✅ Validate staff role updates too
        validateStaffUserRole(role);

        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Staff not found",
                                ErrorCode.STAFF_NOT_FOUND
                        ));

        // ✅ If role is already the same, just return (idempotent)
        if (staff.getRole() != null && staff.getRole().equalsIgnoreCase(role.name())) {
            return toResponse(staff);
        }

        // ✅ Staff.role is STRING
        staff.setRole(role.name());
        staffRepository.save(staff);

        // ✅ Sync UserAccount role too (critical!)
        UserAccount account = userAccountRepository.findFirstByEntityId(staff.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "UserAccount not found for staff",
                        ErrorCode.USER_NOT_FOUND
                ));

        // ✅ UserAccount.role is ENUM
        account.setRole(role);
        userAccountRepository.save(account);

        return toResponse(staff);
    }

    // ================= ROLE VALIDATION =================
    private void validateStaffUserRole(UserRole role) {
        if (role == null) {
            throw new ConflictException("Role is required", ErrorCode.STAFF_CONFLICT);
        }

        // Only allow staff-like roles to be created/updated via staff module
        // ✅ Allowed: STAFF, ADMIN, FINANCE, RISK
        if (role == UserRole.CLIENT || role == UserRole.AGENT || role == UserRole.COURIER) {
            throw new ConflictException(
                    "Invalid staff role: " + role + ". Allowed: STAFF, ADMIN, FINANCE, RISK",
                    ErrorCode.STAFF_CONFLICT
            );
        }
    }

    // ================= ROLE PARSER =================
    // ✅ Keeps your DTOs as String but ensures entity/account always uses enum
    private UserRole parseUserRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new ConflictException("Role is required", ErrorCode.STAFF_CONFLICT);
        }

        try {
            return UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ConflictException(
                    "Invalid role: " + role + ". Allowed: STAFF, ADMIN, FINANCE, RISK",
                    ErrorCode.STAFF_CONFLICT
            );
        }
    }

    // ================= HELPER =================
    private StaffResponse toResponse(Staff staff) {
        return StaffResponse.builder()
                .id(staff.getId())
                .fullName(staff.getFullName())
                .role(staff.getRole()) // String role
                .email(staff.getEmail())
                .phone(staff.getPhone())
                .status(staff.getStatus())
                .hiredAt(staff.getHiredAt())
                .terminatedAt(staff.getTerminatedAt())
                .build();
    }
}
