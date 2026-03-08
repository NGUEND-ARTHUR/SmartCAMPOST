package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.model.Address;
import com.smartcampost.backend.model.Invoice;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.repository.InvoiceRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.service.InvoiceService;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.Objects;

import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@Transactional
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

                // Create a professional PDF invoice
                String fileName = invoice.getInvoiceNumber() + ".pdf";
                Path out = storage.resolve(fileName);
                generateProfessionalPdf(out, invoice, payment);

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
                } catch (Exception ex) {
                    log.warn("Notification failed during invoice issuance", ex);
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

    /**
     * Retrieve all invoices for a given client by their UUID.
     */
    public List<Invoice> getInvoicesForUser(UUID clientId) {
        Objects.requireNonNull(clientId, "clientId is required");
        return invoiceRepository.findByPayment_Parcel_Client_IdOrderByIssuedAtDesc(clientId);
    }

    /**
     * Retrieve a single invoice by its UUID primary key.
     */
    public Invoice getInvoice(UUID invoiceId) {
        Objects.requireNonNull(invoiceId, "invoiceId is required");
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found: " + invoiceId, ErrorCode.BUSINESS_ERROR));
    }

    /**
     * Retrieve all invoices linked to a specific parcel.
     */
    public List<Invoice> getInvoicesByParcel(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        return invoiceRepository.findByPayment_Parcel_IdOrderByIssuedAtDesc(parcelId);
    }

    /**
     * Load the generated PDF file for an invoice as a Spring Resource.
     */
    public Resource loadInvoicePdf(UUID invoiceId) throws IOException {
        Objects.requireNonNull(invoiceId, "invoiceId is required");
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found: " + invoiceId, ErrorCode.BUSINESS_ERROR));

        if (invoice.getPdfLink() == null || invoice.getPdfLink().isBlank()) {
            throw new ResourceNotFoundException(
                    "PDF not available for invoice: " + invoiceId, ErrorCode.BUSINESS_ERROR);
        }

        File pdfFile = new File(invoice.getPdfLink());
        if (!pdfFile.exists()) {
            // Attempt to regenerate the PDF
            log.warn("Invoice PDF file missing at {}. Attempting regeneration.", invoice.getPdfLink());
            regenerateInvoicePdf(invoice);
            pdfFile = new File(invoice.getPdfLink());
            if (!pdfFile.exists()) {
                throw new ResourceNotFoundException(
                        "Invoice PDF file not found on disk", ErrorCode.BUSINESS_ERROR);
            }
        }

        return new FileSystemResource(pdfFile);
    }

    /**
     * Regenerate the PDF for an existing invoice (e.g., if the file was deleted).
     */
    private void regenerateInvoicePdf(Invoice invoice) {
        try {
            Payment payment = invoice.getPayment();
            String fileName = invoice.getInvoiceNumber() + ".pdf";
            Path out = storage.resolve(fileName);
            generateProfessionalPdf(out, invoice, payment);
            invoice.setPdfLink(out.toString());
            invoiceRepository.save(invoice);
            log.info("Regenerated PDF for invoice {}", invoice.getInvoiceNumber());
        } catch (IOException e) {
            log.error("Failed to regenerate invoice PDF for {}: {}", invoice.getInvoiceNumber(), e.getMessage());
        }
    }

    // ============================================================
    //  Professional PDF Generator
    // ============================================================

    private void generateProfessionalPdf(Path outputPath, Invoice invoice, Payment payment) throws IOException {
        final Color PRIMARY = new Color(0, 102, 204);     // SmartCAMPOST blue
        final Color DARK     = new Color(33, 37, 41);
        final Color GRAY     = new Color(108, 117, 125);
        final Color LIGHT_BG = new Color(248, 249, 250);

        Parcel parcel = payment != null ? payment.getParcel() : null;
        String currency = payment != null && payment.getCurrency() != null ? payment.getCurrency() : "XAF";

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            float pw = page.getMediaBox().getWidth();

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = page.getMediaBox().getHeight() - 50;

                // ── Header bar ──
                cs.setNonStrokingColor(PRIMARY);
                cs.addRect(0, y - 5, pw, 45);
                cs.fill();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 22);
                cs.setNonStrokingColor(Color.WHITE);
                cs.newLineAtOffset(50, y + 5);
                cs.showText("SmartCAMPOST");
                cs.endText();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 10);
                cs.setNonStrokingColor(Color.WHITE);
                cs.newLineAtOffset(pw - 200, y + 5);
                cs.showText("INVOICE / FACTURE");
                cs.endText();

                y -= 30;

                // ── Company info line ──
                y -= 30;
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 8);
                cs.setNonStrokingColor(GRAY);
                cs.newLineAtOffset(50, y);
                cs.showText("SmartCAMPOST  |  Douala, Cameroon  |  support@smartcampost.cm  |  +237 222 23 15 05");
                cs.endText();

                // ── Invoice details ──
                y -= 30;
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
                cs.setNonStrokingColor(DARK);
                cs.newLineAtOffset(50, y);
                cs.showText("Invoice #:  " + invoice.getInvoiceNumber());
                cs.endText();

                Instant issuedAt = invoice.getIssuedAt() != null ? invoice.getIssuedAt() : Instant.now();
                String formattedDate = DateTimeFormatter.ofPattern("dd MMM yyyy  HH:mm")
                        .withZone(ZoneId.of("Africa/Douala"))
                        .format(issuedAt);

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 10);
                cs.setNonStrokingColor(GRAY);
                cs.newLineAtOffset(pw - 220, y);
                cs.showText("Date:  " + formattedDate);
                cs.endText();

                // ── Divider ──
                y -= 15;
                cs.setStrokingColor(new Color(222, 226, 230));
                cs.moveTo(50, y);
                cs.lineTo(pw - 50, y);
                cs.stroke();

                // ── Sender / Recipient section ──
                y -= 25;
                float col1 = 50;
                float col2 = pw / 2 + 20;

                // Sender
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 9);
                cs.setNonStrokingColor(PRIMARY);
                cs.newLineAtOffset(col1, y);
                cs.showText("FROM (SENDER)");
                cs.endText();

                y -= 14;
                if (parcel != null && parcel.getSenderAddress() != null) {
                    y = writeAddress(cs, parcel.getSenderAddress(), col1, y, DARK);
                } else {
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA, 9);
                    cs.setNonStrokingColor(GRAY);
                    cs.newLineAtOffset(col1, y);
                    cs.showText("—");
                    cs.endText();
                    y -= 14;
                }

                // Recipient
                float ry = y + 14 + (parcel != null && parcel.getSenderAddress() != null ? 56 : 14);
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 9);
                cs.setNonStrokingColor(PRIMARY);
                cs.newLineAtOffset(col2, ry);
                cs.showText("TO (RECIPIENT)");
                cs.endText();

                ry -= 14;
                if (parcel != null && parcel.getRecipientAddress() != null) {
                    writeAddress(cs, parcel.getRecipientAddress(), col2, ry, DARK);
                } else {
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA, 9);
                    cs.setNonStrokingColor(GRAY);
                    cs.newLineAtOffset(col2, ry);
                    cs.showText("—");
                    cs.endText();
                }

                // ── Parcel information section ──
                y -= 25;
                cs.setNonStrokingColor(LIGHT_BG);
                cs.addRect(45, y - 70, pw - 90, 80);
                cs.fill();

                float infoY = y;
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
                cs.setNonStrokingColor(PRIMARY);
                cs.newLineAtOffset(55, infoY);
                cs.showText("PARCEL DETAILS");
                cs.endText();

                infoY -= 16;
                cs.setFont(PDType1Font.HELVETICA, 9);
                cs.setNonStrokingColor(DARK);

                String trackingRef = parcel != null && parcel.getTrackingRef() != null
                        ? parcel.getTrackingRef() : "N/A";
                String serviceTypeStr = parcel != null && parcel.getServiceType() != null
                        ? parcel.getServiceType().name() : "N/A";
                String deliveryOpt = parcel != null && parcel.getDeliveryOption() != null
                        ? parcel.getDeliveryOption().name() : "N/A";
                String weightStr = parcel != null && parcel.getWeight() != null
                        ? String.format("%.1f kg", parcel.getWeight()) : "N/A";
                String fragileStr = parcel != null && parcel.isFragile() ? "Yes" : "No";

                infoY = writeKeyValue(cs, "Tracking Ref:", trackingRef, 55, infoY, DARK, GRAY);
                infoY = writeKeyValue(cs, "Service:", serviceTypeStr, 55, infoY, DARK, GRAY);
                writeKeyValue(cs, "Weight:", weightStr, 55, infoY, DARK, GRAY);

                // Right column
                float rcY = y - 16;
                rcY = writeKeyValue(cs, "Delivery:", deliveryOpt, col2, rcY, DARK, GRAY);
                rcY = writeKeyValue(cs, "Fragile:", fragileStr, col2, rcY, DARK, GRAY);

                String paymentOpt = parcel != null && parcel.getPaymentOption() != null
                        ? parcel.getPaymentOption().name() : "N/A";
                writeKeyValue(cs, "Payment Option:", paymentOpt, col2, rcY, DARK, GRAY);

                // ── Payment breakdown table ──
                y -= 110;
                // Table header
                cs.setNonStrokingColor(PRIMARY);
                cs.addRect(45, y - 2, pw - 90, 20);
                cs.fill();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 9);
                cs.setNonStrokingColor(Color.WHITE);
                cs.newLineAtOffset(55, y + 4);
                cs.showText("DESCRIPTION");
                cs.endText();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 9);
                cs.setNonStrokingColor(Color.WHITE);
                cs.newLineAtOffset(pw - 170, y + 4);
                cs.showText("AMOUNT (" + currency + ")");
                cs.endText();

                // Table rows
                y -= 22;
                cs.setNonStrokingColor(DARK);
                cs.setFont(PDType1Font.HELVETICA, 9);

                // Shipping charge row
                y = writeTableRow(cs, "Shipping charge (" + serviceTypeStr + ", " + weightStr + ")",
                        String.format("%,.0f", payment != null ? payment.getAmount() : invoice.getTotalAmount()),
                        55, pw - 170, y);

                // Method row
                String methodStr = payment != null && payment.getMethod() != null
                        ? payment.getMethod().name() : "N/A";
                y = writeTableRow(cs, "Payment method: " + methodStr, "", 55, pw - 170, y);

                // Status row
                String statusStr = payment != null && payment.getStatus() != null
                        ? payment.getStatus().name() : "N/A";
                y = writeTableRow(cs, "Payment status: " + statusStr, "", 55, pw - 170, y);

                // Divider before total
                y -= 5;
                cs.setStrokingColor(new Color(222, 226, 230));
                cs.moveTo(45, y);
                cs.lineTo(pw - 45, y);
                cs.stroke();

                // Total row
                y -= 20;
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 12);
                cs.setNonStrokingColor(DARK);
                cs.newLineAtOffset(55, y);
                cs.showText("TOTAL");
                cs.endText();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 12);
                cs.setNonStrokingColor(PRIMARY);
                cs.newLineAtOffset(pw - 170, y);
                cs.showText(String.format("%,.0f %s", invoice.getTotalAmount(), currency));
                cs.endText();

                // ── Footer ──
                float footerY = 60;
                cs.setStrokingColor(PRIMARY);
                cs.setLineWidth(1.5f);
                cs.moveTo(50, footerY + 15);
                cs.lineTo(pw - 50, footerY + 15);
                cs.stroke();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 7);
                cs.setNonStrokingColor(GRAY);
                cs.newLineAtOffset(50, footerY);
                cs.showText("This invoice was automatically generated by SmartCAMPOST. For questions, contact support@smartcampost.cm");
                cs.endText();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 7);
                cs.setNonStrokingColor(GRAY);
                cs.newLineAtOffset(50, footerY - 12);
                cs.showText("SmartCAMPOST - Cameroon National Post Office  |  BP 1234, Douala, Cameroon  |  www.smartcampost.cm");
                cs.endText();
            }

            doc.save(outputPath.toFile());
        }
    }

    private float writeAddress(PDPageContentStream cs, Address addr, float x, float y, Color color) throws IOException {
        cs.setFont(PDType1Font.HELVETICA, 9);
        cs.setNonStrokingColor(color);

        if (addr.getLabel() != null) {
            cs.beginText(); cs.newLineAtOffset(x, y); cs.showText(addr.getLabel()); cs.endText();
            y -= 13;
        }
        if (addr.getStreet() != null && !addr.getStreet().isBlank()) {
            cs.beginText(); cs.newLineAtOffset(x, y); cs.showText(addr.getStreet()); cs.endText();
            y -= 13;
        }
        String cityRegion = (addr.getCity() != null ? addr.getCity() : "")
                + (addr.getRegion() != null ? ", " + addr.getRegion() : "");
        if (!cityRegion.isBlank()) {
            cs.beginText(); cs.newLineAtOffset(x, y); cs.showText(cityRegion); cs.endText();
            y -= 13;
        }
        if (addr.getCountry() != null) {
            cs.beginText(); cs.newLineAtOffset(x, y); cs.showText(addr.getCountry()); cs.endText();
            y -= 13;
        }
        return y;
    }

    private float writeKeyValue(PDPageContentStream cs, String key, String value, float x, float y, Color keyColor, Color valColor) throws IOException {
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA_BOLD, 9);
        cs.setNonStrokingColor(keyColor);
        cs.newLineAtOffset(x, y);
        cs.showText(key);
        cs.endText();

        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA, 9);
        cs.setNonStrokingColor(valColor);
        cs.newLineAtOffset(x + 100, y);
        cs.showText(value);
        cs.endText();
        return y - 14;
    }

    private float writeTableRow(PDPageContentStream cs, String desc, String amount, float descX, float amountX, float y) throws IOException {
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA, 9);
        cs.newLineAtOffset(descX, y);
        cs.showText(desc);
        cs.endText();

        if (amount != null && !amount.isBlank()) {
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(amountX, y);
            cs.showText(amount);
            cs.endText();
        }
        return y - 16;
    }
}
