package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.ComplianceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "compliance_report")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceReport {

    @Id
    @Column(name = "compliance_report_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "generated_at", nullable = false, updatable = false)
    private Instant generatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_staff_id")
    private Staff generatedByStaff;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ComplianceStatus status;

    @Column(name = "file_url", length = 255)
    private String fileUrl;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (generatedAt == null) generatedAt = Instant.now();
        if (status == null) status = ComplianceStatus.GENERATED;
    }
}
