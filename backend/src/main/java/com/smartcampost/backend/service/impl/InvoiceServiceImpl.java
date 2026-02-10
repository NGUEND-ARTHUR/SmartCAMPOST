package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.model.Invoice;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.repository.InvoiceRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.service.InvoiceService;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.ErrorCode;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.Objects;

@Service
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final Path storage;
    
    public InvoiceServiceImpl(InvoiceRepository invoiceRepository, PaymentRepository paymentRepository, NotificationService notificationService) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        try {
            this.storage = Files.createDirectories(Path.of("storage", "invoices"));
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize invoice storage", e);
        }
    }

    @Override
    public Invoice issueInvoiceForPayment(java.util.UUID paymentId) {
        Objects.requireNonNull(paymentId, "paymentId");
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found", ErrorCode.PAYMENT_NOT_FOUND));

        // If an invoice already exists for this payment, return it
        return invoiceRepository.findByPayment(payment).orElseGet(() -> {
            try {
                Invoice invoice = new Invoice();
                invoice.setPayment(payment);
                invoice.setInvoiceNumber(generateInvoiceNumber());
                invoice.setTotalAmount(payment.getAmount());

                // Create a minimal PDF invoice
                String fileName = invoice.getInvoiceNumber() + ".pdf";
                Path out = storage.resolve(fileName);
                try (PDDocument doc = new PDDocument()) {
                    PDPage page = new PDPage(PDRectangle.A4);
                    doc.addPage(page);
                    try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                        cs.beginText();
                        cs.setFont(PDType1Font.HELVETICA_BOLD, 16);
                        cs.newLineAtOffset(50, 750);
                        cs.showText("SmartCAMPOST - Invoice");
                        cs.endText();

                        cs.beginText();
                        cs.setFont(PDType1Font.HELVETICA, 12);
                        cs.newLineAtOffset(50, 720);
                        cs.showText("Invoice #: " + invoice.getInvoiceNumber());
                        cs.newLineAtOffset(0, -15);
                        cs.showText("Amount: " + String.format("%.2f %s", payment.getAmount(), payment.getCurrency()));
                        cs.endText();
                    }
                    doc.save(out.toFile());
                }

                invoice.setPdfLink(out.toString());
                Invoice saved = invoiceRepository.save(invoice);
                Invoice persisted = Objects.requireNonNull(saved, "failed to save invoice");
                try {
                    notificationService.notifyInvoiceIssued(
                            payment.getParcel(),
                            persisted.getInvoiceNumber(),
                            persisted.getTotalAmount(),
                            payment.getCurrency() != null ? payment.getCurrency() : "XAF"
                    );
                } catch (Exception ignored) {
                    // Notification must never break invoice issuance
                }
                return persisted;
            } catch (IOException e) {
                throw new RuntimeException("Failed to generate invoice PDF", e);
            }
        });
    }

    private String generateInvoiceNumber() {
        // Simple unique invoice number: INV-YYYYMMDD-UUID4Short
        String date = DateTimeFormatter.ofPattern("yyyyMMdd").format(OffsetDateTime.now());
        String uuid = UUID.randomUUID().toString().split("-")[0].toUpperCase();
        return String.format("INV-%s-%s", date, uuid);
    }
    @Override
    public java.util.Optional<Invoice> findByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    public List<Invoice> getInvoicesForUser(Long userId) {
        // Not implemented: requires user -> client mapping. Return empty.
        return List.of();
    }

    public Invoice getInvoice(Long invoiceId) {
        return null;
    }

    public List<Invoice> getInvoicesByParcel(Long parcelId) {
        return List.of();
    }

    public Resource loadInvoicePdf(Long invoiceId) throws IOException {
        return null;
    }
}
