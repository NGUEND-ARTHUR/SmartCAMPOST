package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.model.enums.LocationSource;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * ScanEvent is the SINGLE SOURCE OF TRUTH for all parcel movements.
 * Every ScanEvent MUST contain GPS coordinates and timestamp.
 * No status change is allowed without a ScanEvent.
 */
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

    // --------------------------------------------------
    //  🔥 MANDATORY GPS FIELDS (Device GPS is the source)
    // --------------------------------------------------
    @Column(name = "latitude", nullable = false, columnDefinition = "DECIMAL(10,8)")
    private Double latitude;

    @Column(name = "longitude", nullable = false, columnDefinition = "DECIMAL(11,8)")
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_source", nullable = false, length = 20)
    @Builder.Default
    private LocationSource locationSource = LocationSource.DEVICE_GPS;

    @Column(name = "device_timestamp")
    private Instant deviceTimestamp;
    // --------------------------------------------------

    // --------------------------------------------------
    //  🔥 ACTOR IDENTIFICATION (Who performed the action)
    // --------------------------------------------------
    @Column(name = "actor_id", length = 64)
    private String actorId;

    @Column(name = "actor_role", length = 40)
    private String actorRole;
    // --------------------------------------------------

    // --------------------------------------------------
    //  🔥 PROOF & COMMENTS
    // --------------------------------------------------
    @Column(name = "proof_url", length = 500)
    private String proofUrl;

    @Column(name = "comment", length = 1000)
    private String comment;
    // --------------------------------------------------

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

    // --------------------------------------------------
    //  🔥 OFFLINE SYNC SUPPORT
    // --------------------------------------------------
    @Column(name = "is_synced", nullable = false)
    @Builder.Default
    private boolean synced = true;

    @Column(name = "offline_created_at")
    private Instant offlineCreatedAt;

    @Column(name = "synced_at")
    private Instant syncedAt;
    // --------------------------------------------------

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
        if (locationSource == null) {
            locationSource = LocationSource.DEVICE_GPS;
        }
    }
}
