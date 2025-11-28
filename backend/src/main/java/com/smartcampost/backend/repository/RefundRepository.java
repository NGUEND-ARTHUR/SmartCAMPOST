package com.smartcampost.backend.repository;
import com.smartcampost.backend.model.Refund;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.enums.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RefundRepository extends JpaRepository<Refund, UUID> {

    List<Refund> findByPayment(Payment payment);

    List<Refund> findByStatus(RefundStatus status);
}