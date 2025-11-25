package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invoice")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @Column(name = "invoice_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "payment_id",
            nullable = false,
            unique = true,
            referencedColumnName = "payment_id",
            foreignKey = @ForeignKey(name = "fk_invoice_payment")
    )
    private Payment payment;

    @Column(name = "invoice_number", nullable = false, length = 50, unique = true)
    private String invoiceNumber;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount; // mappe sur FLOAT en DB

    @Column(
            name = "issued_at",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant issuedAt;

    @Column(name = "pdf_link", length = 255)
    private String pdfLink;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID(); // BINARY(16)
        }
        if (issuedAt == null) {
            issuedAt = Instant.now();
        }
    }
}
