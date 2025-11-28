package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.ScanEventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "scan_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScanEvent {

    @Id
    @Column(name = "scan_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parcel_id",
            nullable = false,
            referencedColumnName = "parcel_id",
            foreignKey = @ForeignKey(name = "fk_scan_parcel")
    )
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "agency_id",
            referencedColumnName = "agency_id",
            foreignKey = @ForeignKey(name = "fk_scan_agency")
    )
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "agent_id",
            referencedColumnName = "agent_id",
            foreignKey = @ForeignKey(name = "fk_scan_agent")
    )
    private Agent agent;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private ScanEventType eventType;

    @Column(
            name = "timestamp",
            nullable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    )
    private Instant timestamp;

    @Column(name = "location_note", length = 255)
    private String locationNote;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}
