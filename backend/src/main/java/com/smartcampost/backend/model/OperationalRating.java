package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "operational_rating")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationalRating {

    @Id
    @Column(name = "rating_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rated_by_user_id", nullable = false)
    private UserAccount ratedBy;

    @Column(name = "rated_entity_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID ratedEntityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "rated_role", nullable = false, length = 30)
    private UserRole ratedRole;

    @Column(name = "parcel_id", columnDefinition = "BINARY(16)")
    private UUID parcelId;

    @Column(name = "tracking_ref", length = 80)
    private String trackingRef;

    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
