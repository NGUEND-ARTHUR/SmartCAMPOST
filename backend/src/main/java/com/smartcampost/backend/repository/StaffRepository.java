package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StaffRepository extends JpaRepository<Staff, UUID> {

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<Staff> findByPhone(String phone);
}
