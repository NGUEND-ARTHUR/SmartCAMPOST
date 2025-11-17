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
    @Column(name = "scan_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcel_id", nullable = false)
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id")
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private Agent agent;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private ScanEventType eventType;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "location_note", length = 255)
    private String locationNote;
}
