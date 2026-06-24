package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Courier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CourierRepository extends JpaRepository<Courier, UUID> {

    boolean existsByPhone(String phone);
    Optional<Courier> findByPhone(String phone);
}
