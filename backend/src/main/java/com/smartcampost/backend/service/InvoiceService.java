package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Invoice;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceService {

    Invoice issueInvoiceForPayment(UUID paymentId);

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
}
