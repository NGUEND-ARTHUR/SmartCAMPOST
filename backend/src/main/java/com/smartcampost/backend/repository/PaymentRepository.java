package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    // ✅ Pour récupérer tous les paiements d'un colis
    List<Payment> findByParcel_Id(UUID parcelId);
}
