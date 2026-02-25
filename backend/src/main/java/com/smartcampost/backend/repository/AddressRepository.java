package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {
	List<Address> findByClient_Id(UUID clientId);
}
