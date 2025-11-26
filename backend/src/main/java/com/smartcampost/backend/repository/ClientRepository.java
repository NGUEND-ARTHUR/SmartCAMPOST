package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone); // utile aussi
}
