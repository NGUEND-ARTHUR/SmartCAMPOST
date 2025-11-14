package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.ServiceType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "tariff")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tariff {

    @Id
    @Column(name = "tariff_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 20)
    private ServiceType serviceType;

    @Column(name = "origin_zone", nullable = false, length = 50)
    private String originZone;

    @Column(name = "destination_zone", nullable = false, length = 50)
    private String destinationZone;

    @Column(name = "weight_bracket", nullable = false, length = 30)
    private String weightBracket;

    @Column(name = "base_price", nullable = false)
    private Double basePrice;
}
