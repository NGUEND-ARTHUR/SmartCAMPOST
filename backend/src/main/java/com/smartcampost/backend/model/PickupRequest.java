package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.PickupRequestState;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pickup_request")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PickupRequest {

    @Id
    @Column(name = "pickup_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcel_id", nullable = false, unique = true)
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "courier_id")
    private Courier courier;

    @Column(name = "requested_date", nullable = false)
    private LocalDate requestedDate;

    @Column(name = "time_window", nullable = false, length = 30)
    private String timeWindow;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 20)
    private PickupRequestState state;

    @Column(name = "comment")
    private String comment;
}
