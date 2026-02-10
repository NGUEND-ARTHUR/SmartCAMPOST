package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Invoice;
import com.smartcampost.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Optional<Invoice> findByPayment(Payment payment);

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByPayment_Parcel_Client_IdOrderByIssuedAtDesc(UUID clientId);

    List<Invoice> findByPayment_Parcel_IdOrderByIssuedAtDesc(UUID parcelId);
}

