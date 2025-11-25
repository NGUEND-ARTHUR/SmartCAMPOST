package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.ScanEventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "scan_event")
@Data
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
    private Agency agency; // nullable

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "agent_id",
            referencedColumnName = "agent_id",
            foreignKey = @ForeignKey(name = "fk_scan_agent")
    )
    private Agent agent; // nullable

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private ScanEventType eventType;

    // 👉 Champ Java = timestamp, colonne SQL = event_time
    @Column(
            name = "event_time",
            nullable = false,
            updatable = false,
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
