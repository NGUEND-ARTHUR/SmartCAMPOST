package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Historical data for ML training and heuristics.
 * Contains aggregated delivery event data for analytics and predictions.
 */
@Entity
@Table(name = "historical_delivery_event")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricalDeliveryEvent {

    @Id
    @Column(name = "event_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "parcel_id", columnDefinition = "BINARY(16)")
    private UUID parcelId;

    @Column(name = "tracking_ref", length = 80)
    private String trackingRef;

    @Column(name = "origin_agency_id", columnDefinition = "BINARY(16)")
    private UUID originAgencyId;

    @Column(name = "dest_agency_id", columnDefinition = "BINARY(16)")
    private UUID destAgencyId;

    @Column(name = "courier_id", columnDefinition = "BINARY(16)")
    private UUID courierId;

    @Column(name = "service_type", length = 20)
    private String serviceType;

    @Column(name = "delivery_option", length = 20)
    private String deliveryOption;

    @Column(name = "distance_km")
    private Float distanceKm;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "first_scan_at")
    private Instant firstScanAt;

    @Column(name = "last_scan_at")
    private Instant lastScanAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "total_duration_min")
    private Integer totalDurationMin;

    @Column(name = "transit_duration_min")
    private Integer transitDurationMin;

    @Column(name = "num_scan_events")
    private Integer numScanEvents;

    @Column(name = "num_delivery_attempts")
    private Integer numDeliveryAttempts;

    @Column(name = "was_delayed")
    private Boolean wasDelayed;

    @Column(name = "delay_minutes")
    private Integer delayMinutes;

    @Column(name = "final_status", length = 40)
    private String finalStatus;

    @Column(name = "weather_condition", length = 50)
    private String weatherCondition;

    @Column(name = "day_of_week", columnDefinition = "TINYINT")
    private Integer dayOfWeek;

    @Column(name = "hour_of_day", columnDefinition = "TINYINT")
    private Integer hourOfDay;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
    }
}
