package com.smartcampost.backend.bootstrap;

import com.smartcampost.backend.model.Staff;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.StaffStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.StaffRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Creates a default ADMIN account on startup when configured.
 *
 * Safe by default: does nothing unless phone + password are provided.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DefaultAdminBootstrap implements ApplicationRunner {

    private final UserAccountRepository userAccountRepository;
    private final StaffRepository staffRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Value("${smartcampost.bootstrap.default-admin.phone:}")
    private String phone;

    @Value("${smartcampost.bootstrap.default-admin.password:}")
    private String password;

    @Value("${smartcampost.bootstrap.default-admin.full-name:SmartCAMPOST Admin}")
    private String fullName;

    @Value("${smartcampost.bootstrap.default-admin.email:}")
    private String email;

    @Override
    public void run(ApplicationArguments args) {
        if (phone == null || phone.isBlank() || password == null || password.isBlank()) {
            log.info("Default admin bootstrap not configured (missing phone/password)");
            return;
        }

        String normalizedPhone = phone.trim();

        if (userAccountRepository.existsByPhone(normalizedPhone)) {
            log.info("Default admin bootstrap skipped (user already exists for phone={})", maskPhone(normalizedPhone));
            return;
        }

        if (staffRepository.existsByPhone(normalizedPhone)) {
            log.warn("Default admin bootstrap skipped (staff already exists for phone={})", maskPhone(normalizedPhone));
            return;
        }

        String encoded = encoder.encode(password);

        Staff staff = Staff.builder()
                .id(UUID.randomUUID())
                .fullName(Objects.requireNonNullElse(fullName, "SmartCAMPOST Admin"))
                .role(UserRole.ADMIN.name())
                .email(email != null && !email.isBlank() ? email.trim() : null)
                .phone(normalizedPhone)
                .passwordHash(encoded)
                .status(StaffStatus.ACTIVE)
                .hiredAt(LocalDate.now())
                .build();

        staff = staffRepository.save(Objects.requireNonNull(staff, "staff must not be null"));

        UserAccount account = UserAccount.builder()
                .id(UUID.randomUUID())
                .phone(normalizedPhone)
                .passwordHash(encoded)
                .role(UserRole.ADMIN)
                .entityId(staff.getId())
                .build();

        userAccountRepository.save(Objects.requireNonNull(account, "account must not be null"));

        log.info("Default ADMIN account created (phone={})", maskPhone(normalizedPhone));
    }

    private String maskPhone(String phone) {
        if (phone == null) return "";
        String trimmed = phone.trim();
        if (trimmed.length() <= 4) return "****";
        return "****" + trimmed.substring(trimmed.length() - 4);
    }
}
