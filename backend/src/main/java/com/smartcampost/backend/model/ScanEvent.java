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

    // Compatibility fields (legacy API expects these)
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "source", length = 50)
    private String source;

    @Column(name = "scan_type", length = 60)
    private String scanType;

    // scannedBy kept as string for compatibility with legacy numeric or uuid principal names
    @Column(name = "scanned_by", length = 64)
    private String scannedBy;

    @Column(name = "role", length = 40)
    private String role;

    @Column(name = "address", length = 500)
    private String address;

    // Convenience accessors for legacy code
    public java.util.UUID getEventId() { return this.id; }
    public java.util.UUID getParcelId() { return this.parcel != null ? this.parcel.getId() : null; }
    public void setParcelId(java.util.UUID pid) { if (this.parcel == null) { this.parcel = new Parcel(); } this.parcel.setId(pid); }
    public void setScannedBy(long who) { this.scannedBy = String.valueOf(who); }

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
