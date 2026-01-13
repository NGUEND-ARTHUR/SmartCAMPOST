package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

    Optional<UserAccount> findByPhone(String phone);

    Optional<UserAccount> findByEmail(String email);

    boolean existsByPhone(String phone);

    // ✅ NEW: used to fetch the account linked to a Staff/Agent/Courier entity by entityId
    Optional<UserAccount> findFirstByEntityId(UUID entityId);

    // ✅ NEW: Admin dashboard filtering: list users by role (ADMIN/FINANCE/RISK/STAFF/CLIENT/etc.)
    List<UserAccount> findAllByRole(UserRole role);
}
